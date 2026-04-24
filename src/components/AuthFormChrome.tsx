"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import CVBLogo from "@/components/CVBLogo";
import { easeOut, fadeUp, stagger } from "@/lib/motion";

/** Shared icons */
export function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="m3.5 6 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect x="4" y="9" width="12" height="8" rx="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7 9V7a3 3 0 1 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EyeIcon({
  open,
  className = "",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      {open ? (
        <>
          <path
            d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.3" />
        </>
      ) : (
        <>
          <path
            d="M3 10s3-5.5 7-5.5c1.3 0 2.5.4 3.5 1M17 10s-3 5.5-7 5.5c-1.3 0-2.5-.4-3.5-1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path d="m4 4 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Animated checkmark — stroke-dashoffset draw */
export function CheckmarkDraw({ size = 64 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke="#047962"
        strokeWidth="2"
        fill="rgba(4,121,98,0.12)"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.path
        d="M20 33 L29 42 L45 24"
        stroke="#34d399"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.35 }}
      />
    </svg>
  );
}

/** Error banner — slide-down */
export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden>
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 6v4.5M10 13.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <div>{children}</div>
      </div>
    </motion.div>
  );
}

/** Info/success banner */
export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="overflow-hidden rounded-xl border border-primary-400/30 bg-primary-500/10 px-3.5 py-3 text-sm text-primary-200"
      role="status"
    >
      {children}
    </motion.div>
  );
}

/** Pill CTA with magnetic hover + sheen sweep */
export function CinematicCTA({
  children,
  disabled,
  type = "submit",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={reduce || disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: easeOut }}
      className="relative group w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(4,121,98,0.7)] ring-1 ring-inset ring-white/15 transition-opacity disabled:opacity-60 min-h-12"
    >
      {/* Sheen */}
      {!reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[120%]"
        />
      )}
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

/** Wrapper: split-screen frame with header. Consumers render form children. */
export function AuthShell({
  children,
  title,
  subtitle,
  topChip,
}: {
  children: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  topChip?: ReactNode;
}) {
  return (
    <motion.section
      variants={stagger(0.08, 0.05)}
      initial="hidden"
      animate="show"
      className="relative flex w-full max-w-[520px] flex-col gap-6 rounded-[28px] border border-white/8 bg-slate-900/55 p-8 sm:p-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
    >
      {/* Soft emerald rim glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-primary-500/10"
      />
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3 lg:hidden">
          <CVBLogo size={36} />
          <span className="text-sm font-semibold text-white">Clear Vision Boards</span>
        </div>
        {topChip}
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
        <h1 className="font-display text-[28px] sm:text-[32px] font-semibold leading-[1.1] tracking-tight text-white">
          {title}
        </h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </motion.div>

      {children}
    </motion.section>
  );
}

/** The "Accounts not configured" upgraded card */
export function NotConfiguredCard({ flavor }: { flavor: "sign-in" | "sign-up" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-400/30 bg-primary-500/10">
        <CVBLogo size={34} />
      </div>
      <h2 className="font-display text-2xl font-semibold text-white">Accounts not configured</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {flavor === "sign-in"
          ? "The site owner hasn't enabled Supabase yet. Your progress is saved locally in this browser — no account needed."
          : "The site owner hasn't enabled Supabase yet. No account needed — your progress saves locally."}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(4,121,98,0.7)] ring-1 ring-inset ring-white/15"
      >
        Back to app
      </Link>
    </motion.div>
  );
}
