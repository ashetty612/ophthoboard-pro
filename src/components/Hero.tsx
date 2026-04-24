"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, stagger, hoverPress, pulseBadge } from "@/lib/motion";
import SpotlightCursor from "./SpotlightCursor";
import CountUp from "./CountUp";
import CVBLogo from "./CVBLogo";
import LensleyAvatar from "./brand/LensleyAvatar";
import EyesaacAvatar from "./brand/EyesaacAvatar";

/**
 * Clear Vision Boards hero section.
 *
 * Visual thesis: clinical precision meets ophthalmology craft — emerald
 * aurora viewed through a slit lamp. Asymmetric layout: oversized
 * editorial display type on the left, a floating stats cluster on the
 * right. Single big idea per the 3-second rule: "Clear the Boards."
 */

interface HeroProps {
  stats?: {
    cases: number;
    images: number;
    modes: number;
    trials: number;
  };
  onStartRandom?: () => void;
  onOpenAI?: () => void;
  daysUntilExam?: number | null;
}

export default function Hero({ stats, onStartRandom, onOpenAI, daysUntilExam }: HeroProps) {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Hero spotlight layer (emerald cursor glow) */}
      <SpotlightCursor />

      <motion.div
        variants={stagger(0.1, 0.1)}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-6xl px-4 pt-12 pb-8 sm:pt-20 sm:pb-14"
      >
        {/* Eyebrow badge with pulsing dot */}
        <motion.div variants={fadeUp} className="mb-6 flex justify-center">
          <motion.div
            variants={reduce ? undefined : pulseBadge}
            animate={reduce ? undefined : "show"}
            className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/5 px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-300">
              Clear Vision Education · Oral Boards Prep
            </span>
          </motion.div>
        </motion.div>

        {/* Logo + display heading, centered */}
        <motion.div variants={fadeUp} className="mb-4 flex justify-center">
          <CVBLogo size={72} />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-center font-[family-name:var(--font-space-grotesk)] text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white"
        >
          Clear the{" "}
          <span
            className="italic font-[family-name:var(--font-fraunces)] font-semibold bg-clip-text text-transparent bg-gradient-to-br from-primary-300 via-primary-500 to-steel-400"
            style={{ fontStyle: "italic" }}
          >
            Boards
          </span>
          .
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-2xl text-center text-[15px] sm:text-base leading-relaxed text-slate-300"
        >
          400+ oral-board-style cases with personal tutoring from{" "}
          <span className="text-primary-300 font-semibold">Lensley</span> and{" "}
          <span className="text-primary-300 font-semibold">Eyesaac</span> themselves.
        </motion.p>

        {/* Mascots on either side of the subhead — quiet, labeled, framed */}
        <motion.div
          variants={fadeUp}
          className="mx-auto mt-8 flex max-w-2xl items-end justify-center gap-4 sm:gap-10"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <div className="relative rounded-full bg-gradient-to-br from-primary-500/20 to-steel-500/20 p-1.5 ring-1 ring-primary-500/30 shadow-[0_14px_40px_-14px_rgba(4,121,98,0.55)]">
              <div className="rounded-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                <LensleyAvatar size={96} />
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow">
                Lensley
              </span>
            </div>
            <p className="mt-5 text-[10px] text-slate-500 uppercase tracking-[0.18em]">Chief Examiner</p>
            <p className="mt-1 text-[10px] text-slate-600">Asks the questions the board will ask.</p>
          </motion.div>

          {/* Tiny between-mascots accent: a grad cap glyph nodding to CVE */}
          <div className="flex h-24 items-center">
            <span className="text-3xl opacity-30 select-none" aria-hidden>
              ✦
            </span>
          </div>

          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={reduce ? undefined : { duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="relative rounded-full bg-gradient-to-br from-primary-500/20 to-steel-500/20 p-1.5 ring-1 ring-primary-500/30 shadow-[0_14px_40px_-14px_rgba(52,120,150,0.55)]">
              <div className="rounded-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                <EyesaacAvatar size={96} />
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-steel-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow">
                Eyesaac
              </span>
            </div>
            <p className="mt-5 text-[10px] text-slate-500 uppercase tracking-[0.18em]">Co-Resident</p>
            <p className="mt-1 text-[10px] text-slate-600">Catches the zebras before you do.</p>
          </motion.div>
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <motion.button
            onClick={onStartRandom}
            {...hoverPress}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(4,121,98,0.6)] transition-all hover:shadow-[0_14px_40px_-10px_rgba(4,121,98,0.85)]"
          >
            <span className="relative z-10">Start a case</span>
            <svg
              className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
            {/* Sweeping sheen */}
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden
            />
          </motion.button>
          <motion.button
            onClick={onOpenAI}
            {...hoverPress}
            className="inline-flex items-center gap-2 rounded-full border border-steel-500/40 bg-steel-500/5 px-7 py-3.5 font-semibold text-steel-200 transition-colors hover:bg-steel-500/15 hover:text-white"
          >
            <span>Meet the AI examiner</span>
            <span className="text-xs" aria-hidden>
              🎓
            </span>
          </motion.button>
        </motion.div>

        {/* Optional exam countdown chip */}
        {typeof daysUntilExam === "number" && daysUntilExam > 0 && (
          <motion.div variants={fadeUp} className="mt-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3.5 py-1 text-xs font-medium text-amber-300">
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>
                <span className="font-bold text-amber-200">{daysUntilExam}</span> days to your exam
              </span>
            </div>
          </motion.div>
        )}

        {/* Stats band — floating with subtle drift */}
        {stats && (
          <motion.div
            variants={fadeUp}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { label: "Cases", value: stats.cases, suffix: "" },
              { label: "Clinical images", value: stats.images, suffix: "" },
              { label: "AI modes", value: stats.modes, suffix: "" },
              { label: "Landmark trials", value: stats.trials, suffix: "" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/80 to-slate-950/50 p-4 backdrop-blur-sm"
                whileHover={reduce ? undefined : { y: -3, transition: { duration: 0.2 } }}
              >
                {/* Corner emerald accent */}
                <span
                  className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary-500/10 blur-xl"
                  aria-hidden
                />
                <p className="font-[family-name:var(--font-jetbrains-mono)] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  <CountUp value={s.value} duration={1200 + i * 150} />
                  {s.suffix}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Tagline row — three micro-taglines alternating */}
        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-primary-500" />
            20/20 boards prep
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-steel-400" />
            Sharper than a slit lamp
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-primary-500" />
            Diagnose. Differentiate. Dominate.
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
