"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import AuthShowcase from "@/components/AuthShowcase";
import {
  AuthShell,
  CinematicCTA,
  ErrorBanner,
  EyeIcon,
  InfoBanner,
  LockIcon,
  MailIcon,
  NotConfiguredCard,
} from "@/components/AuthFormChrome";
import { easeOut, fadeUp } from "@/lib/motion";

export default function SignInPage() {
  const { supabaseEnabled, signInWithPassword, signInWithOtp } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 40% at 30% 30%, rgba(4,121,98,0.18), transparent 70%), radial-gradient(60% 40% at 70% 70%, rgba(52,120,150,0.15), transparent 70%)",
          }}
        />
        <NotConfiguredCard flavor="sign-in" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full bg-slate-950 text-white">
      {/* Left: form (~55%) */}
      <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-10 lg:w-[55%] lg:flex-none">
        {/* Soft scoped glow for the form panel */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(70% 50% at 20% 20%, rgba(4,121,98,0.12), transparent 70%), radial-gradient(60% 50% at 80% 90%, rgba(52,120,150,0.10), transparent 70%)",
          }}
        />
        <AuthShell
          title={
            <>
              Welcome{" "}
              <em
                className="italic text-primary-300"
                style={{ fontFamily: "var(--font-fraunces, 'Fraunces', 'Iowan Old Style', Georgia, serif)" }}
              >
                back
              </em>
              .
            </>
          }
          subtitle="Sign in to sync cases, streaks, and stats across devices."
        >
          {/* Tab switcher */}
          <motion.div
            variants={fadeUp}
            className="relative grid grid-cols-2 gap-1 rounded-xl border border-white/5 bg-slate-950/60 p-1"
          >
            <motion.span
              layout
              aria-hidden
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-br from-primary-500/90 to-primary-700 shadow-[0_4px_20px_-6px_rgba(4,121,98,0.6)]"
              animate={{ x: mode === "password" ? 4 : "calc(100% + 4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`relative z-10 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "password" ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("magic")}
              className={`relative z-10 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "magic" ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Magic link
            </button>
          </motion.div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {/* Email */}
            <motion.label variants={fadeUp} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Email
              </span>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 peer-focus:text-primary-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clearvisioned.com"
                  autoComplete="email"
                  className="peer w-full rounded-xl border border-white/8 bg-slate-950/60 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all min-h-12 focus:border-primary-400/60 focus:bg-slate-950/90 focus:ring-4 focus:ring-primary-500/15"
                />
              </div>
            </motion.label>

            <AnimatePresence initial={false} mode="wait">
              {mode === "password" && (
                <motion.label
                  key="pw"
                  initial={reduce ? false : { opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.35, ease: easeOut }}
                  className="flex flex-col gap-1.5 overflow-hidden"
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Password
                  </span>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                </motion.label>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && <ErrorBanner key="err">{error}</ErrorBanner>}
              {info && <InfoBanner key="info">{info}</InfoBanner>}
            </AnimatePresence>

            <motion.div variants={fadeUp} className="mt-1">
              <CinematicCTA disabled={loading}>
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {mode === "password" ? "Signing in…" : "Sending link…"}
                  </>
                ) : mode === "password" ? (
                  "Sign in"
                ) : (
                  "Send magic link"
                )}
              </CinematicCTA>
            </motion.div>
          </form>

          <motion.div variants={fadeUp} className="flex flex-col gap-3 pt-2 text-center">
            <p className="text-sm text-slate-400">
              No account?{" "}
              <Link href="/auth/sign-up" className="font-medium text-primary-300 underline-offset-4 hover:underline">
                Request access
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
      </div>

      {/* Right: cinematic showcase (hidden < lg) */}
      <AuthShowcase />
    </div>
  );
}
