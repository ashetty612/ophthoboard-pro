"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const { supabaseEnabled, signInWithPassword, signInWithOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    if (mode === "password") {
      const { error: err } = await signInWithPassword(email, password);
      setLoading(false);
      if (err) setError(err);
      else router.push("/");
    } else {
      const { error: err } = await signInWithOtp(email);
      setLoading(false);
      if (err) setError(err);
      else setInfo("Check your email for the magic sign-in link.");
    }
  }

  if (!supabaseEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <p className="text-lg text-white font-bold mb-2">Accounts not configured</p>
          <p className="text-sm text-slate-400 mb-4">
            The site owner hasn&apos;t enabled Supabase yet. Your progress is saved locally in this
            browser — no account needed.
          </p>
          <Link href="/" className="btn-pill btn-pill-primary inline-flex">
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-sm text-slate-400 mb-6">Sign in to sync your progress across devices.</p>

        <div className="flex gap-1 mb-5 bg-slate-800/60 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "password" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "magic" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Magic link
          </button>
        </div>

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
          {mode === "password" && (
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm min-h-[44px]"
              autoComplete="current-password"
            />
          )}
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          {info && <p className="text-emerald-400 text-sm">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill btn-pill-primary justify-center disabled:opacity-60"
          >
            {loading ? "Signing in…" : mode === "password" ? "Sign in" : "Send magic link"}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-6">
          No account?{" "}
          <Link href="/auth/sign-up" className="text-primary-400 hover:text-primary-300 underline">
            Sign up
          </Link>
        </p>
        <p className="text-[11px] text-slate-500 text-center mt-3">
          Closed beta — requires an invited email.
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
