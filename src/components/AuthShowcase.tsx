"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CVBLogo from "@/components/CVBLogo";
import { easeOut } from "@/lib/motion";

/**
 * Cinematic right-panel for /auth pages. Scoped aurora, rotating highlights,
 * big animated logo, Fraunces tagline. Hidden on < lg.
 */
const HIGHLIGHTS = [
  { k: "432", label: "image-backed cases" },
  { k: "10", label: "AI examiner modes" },
  { k: "3.5m", label: "real ABO pacing" },
  { k: "27", label: "fatal-flaw safety nets" },
] as const;

export default function AuthShowcase() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % HIGHLIGHTS.length), 4000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <aside className="relative hidden lg:flex lg:w-[45%] xl:w-[45%] flex-col overflow-hidden border-l border-white/5 bg-slate-950">
      {/* Scoped aurora */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute -top-32 -left-24 h-[60vh] w-[60vh] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #047962 0%, transparent 65%)", opacity: 0.55 }}
          animate={reduce ? undefined : { x: [0, 40, -20, 0], y: [0, 30, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-24 h-[55vh] w-[55vh] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #347896 0%, transparent 65%)", opacity: 0.45 }}
          animate={reduce ? undefined : { x: [0, -40, 20, 0], y: [0, -30, -60, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-[40vh] w-[40vh] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #10a37f 0%, transparent 70%)", opacity: 0.3 }}
          animate={reduce ? undefined : { scale: [1, 1.18, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,12,0.65)_100%)]" />
        {/* Grid lines — subtle */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden>
          <defs>
            <pattern id="showcase-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#34d399" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#showcase-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
        {/* Top: logo + wordmark */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <CVBLogo size={56} />
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-[0.22em] text-primary-300/80">
              Clear Vision Boards
            </span>
            <span className="text-sm text-slate-400">v1 · Closed Beta</span>
          </div>
        </motion.div>

        {/* Middle: giant logo + tagline + rotating stat */}
        <div className="flex flex-col items-start gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-full bg-primary-500/10 blur-2xl" aria-hidden />
            <CVBLogo size={120} className="relative" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.25 }}
            className="font-display text-5xl xl:text-6xl leading-[1.05] tracking-tight text-white"
          >
            Clear the{" "}
            <em
              className="italic text-primary-300"
              style={{ fontFamily: "var(--font-fraunces, 'Fraunces', 'Iowan Old Style', Georgia, serif)" }}
            >
              Boards
            </em>
            <span className="text-primary-400">.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.4 }}
            className="max-w-md text-base leading-relaxed text-slate-300/90"
          >
            An oral-boards simulator built by ophthalmology residents, for ophthalmology
            residents. Train with the same pacing, pressure, and fatal-flaw traps as the real ABO.
          </motion.p>

          {/* Rotating highlight */}
          <div className="relative h-24 w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={HIGHLIGHTS[i].label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.55, ease: easeOut }}
                className="absolute inset-0 flex items-center gap-5"
              >
                <div className="relative flex h-20 w-24 shrink-0 items-center justify-center rounded-2xl border border-primary-400/30 bg-primary-500/10 backdrop-blur-sm">
                  <span className="font-display text-3xl font-bold text-primary-200 tabular-nums">
                    {HIGHLIGHTS[i].k}
                  </span>
                  <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Feature {i + 1} / {HIGHLIGHTS.length}
                  </span>
                  <span className="mt-1 text-xl text-white">{HIGHLIGHTS[i].label}</span>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Progress dots */}
            <div className="absolute -bottom-2 left-0 flex gap-1.5">
              {HIGHLIGHTS.map((h, idx) => (
                <span
                  key={h.label}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === i ? "w-8 bg-primary-400" : "w-2 bg-white/15"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center gap-2 text-xs text-slate-500"
        >
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full bg-primary-400"
            animate={reduce ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="uppercase tracking-[0.24em]">by Clear Vision Education</span>
        </motion.div>
      </div>
    </aside>
  );
}
