"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ophtho_boards_onboarding_v1";

export interface TourStep {
  /** CSS selector for element to highlight. Null = centered dialog (welcome). */
  target: string | null;
  label: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: null,
    label: "Welcome",
    title: "Welcome to OphthoBoard Pro.",
    body: "We're going to do a 60-second tour so you know where to start. You can skip anytime.",
  },
  {
    target: "[data-tour='subspecialties']",
    label: "Study any case",
    title: "Study any case.",
    body: "Pick a subspecialty here and study any of 432 cases. Each one is ABO-style with structured questions.",
  },
  {
    target: "[data-tour='exam']",
    label: "Simulate the exam",
    title: "Simulate the exam.",
    body: "Run a timed Exam Simulation or Paired-Topic Mock Exam. Tests you under real ABO timing and pressure.",
  },
  {
    target: "[data-tour='ai-examiner']",
    label: "AI examiner",
    title: "Practice with an AI examiner.",
    body: "A real-time examiner that probes follow-ups like the real thing. Use it to find the edges of what you actually know.",
  },
  {
    target: "[data-tour='cram']",
    label: "Cram when it counts",
    title: "Cram when it counts.",
    body: "Printable, subspecialty-organized cheat sheet with 15+ high-yield pearls each. Great for the final week.",
  },
  {
    target: "[data-tour='due-today']",
    label: "Track your weakest areas",
    title: "Target your weak spots.",
    body: "Due Today, Weakness Drill, and the Performance Heatmap combine spaced repetition with targeted practice.",
  },
  {
    target: "[data-tour='exam-week']",
    label: "Set your exam date",
    title: "Set your exam date.",
    body: "Toggle Exam-Week Mode and a countdown appears. The app narrows to high-yield modes only.",
  },
];

export const ONBOARDING_TOTAL_STEPS = STEPS.length;

interface Props {
  /**
   * When `true`, the tour is allowed to render if localStorage says it hasn't
   * been completed or skipped. The parent decides when onboarding may run
   * (e.g., only once data has loaded).
   */
  enabled: boolean;
  /**
   * When set to a value that changes (e.g. Date.now()), forces the tour to
   * run regardless of the localStorage flag. Used by the "Re-run tour" button.
   */
  forceRunToken?: number;
  onFinished?: (reason: "completed" | "skipped") => void;
}

function setFlag(value: "completed" | "skipped") {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    /* storage unavailable — silently skip */
  }
}

function readFlag(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear the onboarding flag so the tour will run on next load. Exported for
 * the "Re-run tour" button in settings.
 */
export function resetOnboardingFlag() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingTour({ enabled, forceRunToken, onFinished }: Props) {
  // All hooks at top — no early returns before hook calls.
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Mount guard for portal (SSR safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Decide whether to auto-open based on storage flag + enabled prop.
  useEffect(() => {
    if (!enabled) return;
    const flag = readFlag();
    if (flag !== "completed" && flag !== "skipped") {
      setStepIndex(0);
      setActive(true);
    }
  }, [enabled]);

  // Force-run from settings ("Re-run tour" button).
  useEffect(() => {
    if (forceRunToken === undefined) return;
    setStepIndex(0);
    setActive(true);
  }, [forceRunToken]);

  const step = STEPS[stepIndex];

  // Measure highlighted element and scroll it into view.
  const measureTarget = useCallback(() => {
    if (!active) return;
    if (!step || !step.target) {
      setRect(null);
      return;
    }
    if (typeof document === "undefined") return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [active, step]);

  // Scroll target into view when step changes.
  useEffect(() => {
    if (!active || !step?.target || typeof document === "undefined") return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active, step]);

  // Keep rect in sync with scroll/resize while active.
  useLayoutEffect(() => {
    if (!active) return;
    measureTarget();
    // Re-measure after the smooth-scroll settles
    const t = window.setTimeout(measureTarget, 350);
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, measureTarget]);

  const finish = useCallback(
    (reason: "completed" | "skipped") => {
      setActive(false);
      setFlag(reason);
      onFinished?.(reason);
    },
    [onFinished]
  );

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= STEPS.length - 1) {
        setActive(false);
        setFlag("completed");
        onFinished?.("completed");
        return i;
      }
      return i + 1;
    });
  }, [onFinished]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard: Space/→ = Next, ← = Back, Esc = Skip.
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish("skipped");
      } else if (e.key === "ArrowRight" || e.key === " " || e.code === "Space") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, next, back, finish]);

  // Focus the tooltip when it opens / step changes, for screen readers.
  useEffect(() => {
    if (!active) return;
    tooltipRef.current?.focus();
  }, [active, stepIndex]);

  // Tooltip placement relative to highlighted rect.
  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    if (!rect || typeof window === "undefined") {
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    const TOOLTIP_W = 360;
    const GAP = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - (rect.top + rect.height);
    const placeBelow = spaceBelow > 220 || rect.top < 220;
    const top = placeBelow ? rect.top + rect.height + GAP : Math.max(16, rect.top - GAP - 200);
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(16, Math.min(left, vw - TOOLTIP_W - 16));
    return { left, top, width: TOOLTIP_W };
  }, [rect]);

  if (!mounted || !active) return null;

  // Note: the overlay uses position:fixed with z-[100], so it escapes local
  // stacking contexts without needing a React portal (which would require
  // @types/react-dom, not installed in this project).

  const isCentered = !step.target || !rect;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      aria-hidden={false}
      role="presentation"
      className="fixed inset-0 z-[100] animate-fade-in"
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop with SVG-cutout spotlight around the target (or solid dim for centered). */}
      {isCentered ? (
        <div
          className="absolute inset-0"
          style={{ background: "rgba(2, 10, 19, 0.78)", backdropFilter: "blur(2px)" }}
          onClick={() => finish("skipped")}
        />
      ) : (
        <svg
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
          onClick={() => finish("skipped")}
        >
          <defs>
            <mask id="ophtho-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect!.left - 8}
                y={rect!.top - 8}
                width={rect!.width + 16}
                height={rect!.height + 16}
                rx="14"
                ry="14"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(2, 10, 19, 0.78)"
            mask="url(#ophtho-tour-mask)"
          />
          {/* Emerald glow ring on the target */}
          <rect
            x={rect!.left - 8}
            y={rect!.top - 8}
            width={rect!.width + 16}
            height={rect!.height + 16}
            rx="14"
            ry="14"
            fill="none"
            stroke="rgba(16, 163, 127, 0.9)"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 14px rgba(4, 121, 98, 0.55))" }}
          />
        </svg>
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ophtho-tour-title"
        aria-describedby="ophtho-tour-body"
        tabIndex={-1}
        className="absolute max-w-[calc(100vw-32px)] rounded-2xl glass-card p-5 shadow-2xl outline-none animate-fade-in-up"
        style={{
          ...tooltipStyle,
          border: "1px solid rgba(16, 163, 127, 0.35)",
          background: "rgba(15, 23, 42, 0.92)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-primary-400 uppercase tracking-[0.22em] font-semibold">
            Step {stepIndex + 1} of {STEPS.length} · {step.label}
          </p>
          <button
            onClick={() => finish("skipped")}
            className="text-[11px] text-slate-400 hover:text-white transition-colors"
            aria-label="Skip tour"
          >
            Skip
          </button>
        </div>

        <h2 id="ophtho-tour-title" className="text-lg font-semibold text-white mb-1.5 tracking-tight">
          {step.title}
        </h2>
        <p id="ophtho-tour-body" className="text-sm text-slate-300 leading-relaxed mb-4">
          {step.body}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? "w-6 bg-primary-400"
                  : i < stepIndex
                  ? "w-1.5 bg-primary-600/70"
                  : "w-1.5 bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={back}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {isFirst && (
              <button
                onClick={() => finish("skipped")}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={next}
              className="btn-pill btn-pill-primary text-sm py-2 px-5"
            >
              {isFirst ? "Start tour" : isLast ? "Finish" : "Next →"}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-3 text-center">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px]">←</kbd>
          <span className="mx-1">back</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px]">→</kbd>
          <span className="mx-1">next</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px]">Esc</kbd>
          <span className="ml-1">skip</span>
        </p>
      </div>
    </div>
  );
}
