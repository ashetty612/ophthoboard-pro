"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/**
 * Small sign-in / account chip for the header. Renders nothing when
 * Supabase is not configured (app-only mode).
 */
export default function AuthButton() {
  const { supabaseEnabled, user, signOut } = useAuth();

  if (!supabaseEnabled) return null;

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

  const initial = (user.email || "?").charAt(0).toUpperCase();
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center"
        title={user.email || ""}
        aria-label={`Signed in as ${user.email}`}
      >
        {initial}
      </span>
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
