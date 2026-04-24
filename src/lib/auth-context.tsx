"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { isSupabaseEnabled, supabase } from "./supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  supabaseEnabled: boolean;
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  supabaseEnabled: false,
  session: null,
  user: null,
  loading: false,
  signInWithPassword: async () => ({ error: "Auth not configured" }),
  signInWithOtp: async () => ({ error: "Auth not configured" }),
  signUp: async () => ({ error: "Auth not configured" }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isSupabaseEnabled();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    const sb = supabase();
    if (!sb) return;

    // Fetch existing session
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  const value = useMemo<AuthState>(() => {
    return {
      supabaseEnabled: enabled,
      session,
      user: session?.user ?? null,
      loading,
      async signInWithPassword(email, password) {
        const sb = supabase();
        if (!sb) return { error: "Auth not configured" };
        const { error } = await sb.auth.signInWithPassword({ email, password });
        return { error: error?.message };
      },
      async signInWithOtp(email) {
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
      },
      async signUp(email, password) {
        const sb = supabase();
        if (!sb) return { error: "Auth not configured" };
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
          },
        });
        return { error: error?.message };
      },
      async signOut() {
        const sb = supabase();
        if (!sb) return;
        await sb.auth.signOut();
      },
    };
  }, [enabled, session, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
