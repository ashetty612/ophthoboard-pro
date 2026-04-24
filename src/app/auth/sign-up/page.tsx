"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const { supabaseEnabled, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) {
      // Friendly message for the closed-beta trigger
      if (/allowlist/i.test(err)) {
        setError("That email isn't on the beta list. Contact the site owner for access.");
      } else {
        setError(err);
      }
    } else {
      setSuccess(true);
    }
  }

  if (!supabaseEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <p className="text-lg text-white font-bold mb-2">Accounts not configured</p>
          <p className="text-sm text-slate-400 mb-4">
            The site owner hasn&apos;t enabled Supabase yet. No account needed — your progress saves
            locally.
          </p>
          <Link href="/" className="btn-pill btn-pill-primary inline-flex">
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <div className="text-5xl mb-3">📬</div>
          <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-sm text-slate-400 mb-5">
            We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to
            finish creating your account.
          </p>
          <Link href="/auth/sign-in" className="btn-pill btn-pill-primary inline-flex">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sm text-slate-400 mb-6">Closed beta — your email must be on the invite list.</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm min-h-[44px]"
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm min-h-[44px]"
            autoComplete="new-password"
          />
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill btn-pill-primary justify-center disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary-400 hover:text-primary-300 underline">
            Sign in
          </Link>
        </p>
        <div className="mt-5 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-white">
            ← Continue as guest (local-only)
          </Link>
        </div>
      </div>
    </div>
  );
}
