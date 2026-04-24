"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/**
 * Small sign-in / account chip for the header. Renders nothing when
 * Supabase is not configured (app-only mode).
 */
export default function AuthButton() {
  const { mode, user, signOut } = useAuth();

  if (!user) {
    return (
      <Link
        href="/auth/sign-in"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors min-h-[36px]"
        aria-label="Sign in"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Sign in
      </Link>
    );
  }

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center ring-1 ring-primary-400/40"
        title={`${user.email || ""} (${mode === "supabase" ? "cloud-synced" : "local"})`}
        aria-label={`Signed in as ${user.email} via ${mode}`}
      >
        {initial}
      </span>
      {mode === "local" && (
        <span
          className="hidden sm:inline-block text-[9px] uppercase tracking-[0.18em] text-slate-500"
          title="Local account — works offline; enable Supabase for cross-device sync"
        >
          Local
        </span>
      )}
      <button
        onClick={() => void signOut()}
        className="text-xs text-slate-400 hover:text-white transition-colors"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}
