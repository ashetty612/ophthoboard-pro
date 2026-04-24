"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { ReactNode } from "react";

/**
 * StudyModeCard — the primary bento tile for the Study Modes grid.
 *
 * Each card is a dark glass surface with a gradient border that animates
 * in on hover, a gradient icon chip with a floating corner orb, a Space
 * Grotesk title that color-shifts on hover, and a chevron that slides
 * right. Sizes control the bento footprint (sm/md/lg).
 *
 * All motion respects `prefers-reduced-motion`.
 */

export type StudyModeSize = "sm" | "md" | "lg" | "xl" | "wide" | "tall";

export interface StudyModeCardProps {
  label: string;
  desc: string;
  icon: ReactNode; // emoji or custom node
  /** Tailwind gradient classes, e.g. "from-primary-500 to-steel-500". */
  gradient?: string;
  badge?: "new" | "popular" | "hot";
  size?: StudyModeSize;
  onClick: () => void;
  highYield?: boolean;
  /** Optional data-tour attribute hook. */
  tourId?: string;
  /** Optional extra status line, rendered small below desc. */
  status?: string;
  /** Optional aria-label override. */
  ariaLabel?: string;
}

const SIZE_CLASSES: Record<StudyModeSize, string> = {
  sm: "col-span-2 row-span-1",
  md: "col-span-2 row-span-1 sm:col-span-3 sm:row-span-1",
  lg: "col-span-2 row-span-2 sm:col-span-3 sm:row-span-2",
  xl: "col-span-2 row-span-2 sm:col-span-6 sm:row-span-2",
  wide: "col-span-2 row-span-1 sm:col-span-6 sm:row-span-1",
  tall: "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2",
};

const BADGE_CONFIG: Record<NonNullable<StudyModeCardProps["badge"]>, { label: string; cls: string }> = {
  new: { label: "NEW", cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40" },
  popular: { label: "POPULAR", cls: "bg-amber-400/15 text-amber-300 border-amber-400/40" },
  hot: { label: "HOT", cls: "bg-rose-500/15 text-rose-300 border-rose-500/40" },
};

export default function StudyModeCard({
  label,
  desc,
  icon,
  gradient = "from-primary-500 to-steel-500",
  badge,
  size = "sm",
  onClick,
  highYield,
  tourId,
  status,
  ariaLabel,
}: StudyModeCardProps) {
  const reduce = useReducedMotion();

  const isFeature = size === "lg" || size === "xl";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={fadeUp}
      data-tour={tourId}
      aria-label={ariaLabel || label}
      whileHover={reduce ? undefined : { y: -3, scale: 1.015, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={reduce ? undefined : { scale: 0.985, transition: { duration: 0.1 } }}
      className={`group relative ${SIZE_CLASSES[size]} isolate overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950/60 p-5 text-left backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
    >
      {/* Animated gradient border on hover */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100`}
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, rgba(4,121,98,0.55), rgba(52,120,150,0.55), rgba(4,121,98,0))",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Floating gradient orb in corner */}
      <motion.span
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.12] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.28]`}
        animate={reduce ? undefined : { x: [0, 6, 0], y: [0, -4, 0] }}
        transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Corner accent dot */}
      <span
        aria-hidden
        className={`absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-gradient-to-br ${gradient} shadow-[0_0_12px_rgba(4,121,98,0.6)]`}
      />

      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          {/* Gradient icon chip with subtle glow */}
          <div
            className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} ${isFeature ? "h-14 w-14 text-3xl" : "h-11 w-11 text-xl"} shadow-[0_8px_24px_-10px_rgba(4,121,98,0.55)]`}
          >
            <span className="drop-shadow-sm" aria-hidden>{icon}</span>
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className={`font-[family-name:var(--font-space-grotesk)] font-semibold text-white transition-colors group-hover:text-primary-200 ${isFeature ? "text-lg sm:text-xl" : "text-sm sm:text-[15px]"} tracking-tight leading-tight`}
              >
                {label}
              </h4>
              {badge && (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-[1px] text-[9px] font-bold uppercase tracking-[0.12em] ${BADGE_CONFIG[badge].cls}`}
                >
                  {BADGE_CONFIG[badge].label}
                </span>
              )}
              {highYield && !badge && (
                <span className="inline-flex items-center rounded-full border border-primary-500/30 bg-primary-500/5 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-300">
                  High-yield
                </span>
              )}
            </div>
          </div>
        </div>

        <p
          className={`text-slate-400 ${isFeature ? "text-sm leading-relaxed" : "text-xs leading-relaxed"} line-clamp-2`}
        >
          {desc}
        </p>

        {status && (
          <p className="mt-auto font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {status}
          </p>
        )}

        {/* Chevron that slides right on hover */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600 group-hover:text-slate-400 transition-colors">
            Open
          </span>
          <motion.span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400 transition-colors group-hover:border-primary-400/50 group-hover:bg-primary-500/10 group-hover:text-primary-200"
            initial={false}
            whileHover={reduce ? undefined : { x: 3 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}
