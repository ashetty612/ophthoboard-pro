"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { isSupabaseEnabled, supabase } from "./supabase/client";
import type { Session as SupabaseSession, User } from "@supabase/supabase-js";
import * as LocalAuth from "./local-auth";

/**
 * Unified auth context.
 *
 *  Flow:
 *    - If Supabase env vars are configured → use Supabase as the source of
 *      truth. Cross-device sync, server-verified sessions.
 *    - Otherwise → fall back to a local PBKDF2-hashed account stored in
 *      localStorage. Works on any device offline. Progress is scoped to
 *      the local user.
 *
 *  From the consumer's perspective the API is identical; only `mode`
 *  and `user.displayName` differ when in local mode.
 */

export type AuthMode = "supabase" | "local";

interface UnifiedUser {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  supabaseEnabled: boolean;
  mode: AuthMode;
  user: UnifiedUser | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  supabaseEnabled: false,
  mode: "local",
  user: null,
  loading: false,
  signInWithPassword: async () => ({ error: "Auth not configured" }),
  signInWithOtp: async () => ({ error: "Magic link requires Supabase. Use password sign-in." }),
  signUp: async () => ({ error: "Auth not configured" }),
  signOut: async () => {},
});

function toUnified(u: User | LocalAuth.Session | null): UnifiedUser | null {
  if (!u) return null;
  if ("userId" in u) {
    return { id: u.userId, email: u.email, displayName: u.displayName };
  }
  return { id: u.id, email: u.email || "", displayName: (u.user_metadata as { displayName?: string } | undefined)?.displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isSupabaseEnabled();
  const mode: AuthMode = enabled ? "supabase" : "local";
  const [supabaseSession, setSupabaseSession] = useState<SupabaseSession | null>(null);
  const [localSession, setLocalSession] = useState<LocalAuth.Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    let cancelled = false;
    if (enabled) {
      const sb = supabase();
      if (!sb) { setLoading(false); return; }
      sb.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        setSupabaseSession(data.session);
        setLoading(false);
        // First-load sync: pull cloud history if signed in.
        if (data.session?.user) {
          import("./supabase/sync").then((m) => void m.pullEverything());
        }
      });
      const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
        setSupabaseSession(s);
        // Pull-and-merge on every sign-in event so signing in on a new
        // device gives the user their progress immediately.
        if (event === "SIGNED_IN" && s?.user) {
          import("./supabase/sync").then((m) => void m.pullEverything());
        }
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    } else {
      setLocalSession(LocalAuth.getSession());
      setLoading(false);
    }
  }, [enabled]);

  const value = useMemo<AuthState>(() => {
    const user = enabled
      ? toUnified(supabaseSession?.user ?? null)
      : toUnified(localSession);

    return {
      supabaseEnabled: enabled,
      mode,
      user,
      loading,
      async signInWithPassword(email, password) {
        if (enabled) {
          const sb = supabase();
          if (!sb) return { error: "Auth not configured" };
          const { error } = await sb.auth.signInWithPassword({ email, password });
          return { error: error?.message };
        }
        const res = await LocalAuth.signIn(email, password);
        if (!res.ok) return { error: res.error };
        setLocalSession(res.session);
        return {};
      },
      async signInWithOtp(email) {
        if (enabled) {
          const sb = supabase();
          if (!sb) return { error: "Auth not configured" };
          const { error } = await sb.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo:
                typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
            },
          });
          return { error: error?.message };
        }
        return { error: "Magic link requires cloud accounts. Use a password in local mode." };
      },
      async signUp(email, password, displayName) {
        if (enabled) {
          const sb = supabase();
          if (!sb) return { error: "Auth not configured" };
          const { error } = await sb.auth.signUp({
            email,
            password,
            options: {
              data: { displayName },
              emailRedirectTo:
                typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
            },
          });
          return { error: error?.message };
        }
        const res = await LocalAuth.signUp(email, password, displayName);
        if (!res.ok) return { error: res.error };
        setLocalSession(res.session);
        return {};
      },
      async signOut() {
        if (enabled) {
          const sb = supabase();
          if (sb) await sb.auth.signOut();
          setSupabaseSession(null);
        } else {
          LocalAuth.signOut();
          setLocalSession(null);
        }
      },
    };
  }, [enabled, mode, supabaseSession, localSession, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
