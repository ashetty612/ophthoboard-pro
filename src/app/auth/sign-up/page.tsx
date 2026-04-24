"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import AuthShowcase from "@/components/AuthShowcase";
import {
  AuthShell,
  CheckmarkDraw,
  CinematicCTA,
  ErrorBanner,
  EyeIcon,
  LockIcon,
  MailIcon,
  NotConfiguredCard,
} from "@/components/AuthFormChrome";
import { easeOut, fadeUp } from "@/lib/motion";

export default function SignUpPage() {
  const { supabaseEnabled, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<React.ReactNode>("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) {
      if (/allowlist/i.test(err)) {
        setError(
          <span>
            This email isn&apos;t on our beta list yet. Invites are being sent in waves — you can
            email{" "}
            <a
              href="mailto:beta@clearvisioned.com"
              className="font-medium text-rose-100 underline underline-offset-2"
            >
              beta@clearvisioned.com
            </a>{" "}
            for early access.
          </span>,
        );
      } else {
        setError(err);
      }
    } else {
      setSuccess(true);
    }
  }

  if (!supabaseEnabled) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 40% at 30% 30%, rgba(4,121,98,0.18), transparent 70%), radial-gradient(60% 40% at 70% 70%, rgba(52,120,150,0.15), transparent 70%)",
          }}
        />
        <NotConfiguredCard flavor="sign-up" />
      </div>
    );
  }

  // Password strength — simple indicator (length + classes)
  const pwScore = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  })();
  const pwLabel = ["Too short", "Weak", "Fair", "Strong", "Excellent"][pwScore];

  return (
    <div className="relative flex min-h-screen w-full bg-slate-950 text-white">
      {/* Left: form */}
      <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-10 lg:w-[55%] lg:flex-none">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(70% 50% at 20% 20%, rgba(4,121,98,0.12), transparent 70%), radial-gradient(60% 50% at 80% 90%, rgba(52,120,150,0.10), transparent 70%)",
          }}
        />
        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="relative flex w-full max-w-[520px] flex-col items-center gap-5 rounded-[28px] border border-white/8 bg-slate-900/55 p-10 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            <CheckmarkDraw size={72} />
            <h1 className="font-display text-2xl font-semibold text-white">Check your email</h1>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              We sent a confirmation link to{" "}
              <strong className="text-white">{email}</strong>. Click it to finish creating your
              account.
            </p>
            <Link
              href="/auth/sign-in"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(4,121,98,0.7)] ring-1 ring-inset ring-white/15"
            >
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          <AuthShell
            title={
              <>
                Join the{" "}
                <em
                  className="italic text-primary-300"
                  style={{ fontFamily: "var(--font-fraunces, 'Fraunces', 'Iowan Old Style', Georgia, serif)" }}
                >
                  beta
                </em>
                .
              </>
            }
            subtitle="Create an account to sync progress across devices."
            topChip={
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-200"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-300" />
                </span>
                Closed Beta
              </motion.span>
            }
          >
            <form onSubmit={submit} className="flex flex-col gap-3">
              <motion.label variants={fadeUp} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Email
                </span>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@clearvisioned.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/8 bg-slate-950/60 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all min-h-12 focus:border-primary-400/60 focus:bg-slate-950/90 focus:ring-4 focus:ring-primary-500/15"
                  />
                </div>
              </motion.label>

              <motion.label variants={fadeUp} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Password
                </span>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/8 bg-slate-950/60 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-600 outline-none transition-all min-h-12 focus:border-primary-400/60 focus:bg-slate-950/90 focus:ring-4 focus:ring-primary-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPw} className="h-4 w-4" />
                  </button>
                </div>
                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            n < pwScore
                              ? pwScore <= 1
                                ? "bg-rose-400"
                                : pwScore === 2
                                  ? "bg-amber-400"
                                  : "bg-primary-400"
                              : "bg-white/8"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {pwLabel}
                    </span>
                  </div>
                )}
              </motion.label>

              <AnimatePresence>
                {error && <ErrorBanner key="err">{error}</ErrorBanner>}
              </AnimatePresence>

              <motion.div variants={fadeUp} className="mt-1">
                <CinematicCTA disabled={loading}>
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </CinematicCTA>
              </motion.div>
            </form>

            <motion.div variants={fadeUp} className="flex flex-col gap-3 pt-2 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/auth/sign-in"
                  className="font-medium text-primary-300 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <div className="relative flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-600">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                  <path
                    d="M9 4 5 8l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Continue as guest (local-only)
              </Link>
            </motion.div>
          </AuthShell>
        )}
      </div>

      {/* Right: cinematic showcase */}
      <AuthShowcase />
    </div>
  );
}
