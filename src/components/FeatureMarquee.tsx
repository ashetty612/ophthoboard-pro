"use client";

import { useReducedMotion } from "framer-motion";

/**
 * FeatureMarquee — infinite horizontal scroll of small value-prop chips.
 *
 * Uses a CSS keyframe animation on a duplicated track so the loop is
 * seamless and pausing on hover works via `animation-play-state: paused`
 * (which framer-motion's transform-based animations cannot do natively).
 *
 *  - 30s linear cycle
 *  - Pauses on hover/focus
 *  - Respects prefers-reduced-motion (falls back to static wrap)
 */

interface FeatureChip {
  icon: string;
  text: string;
}

const DEFAULT_CHIPS: FeatureChip[] = [
  { icon: "🎯", text: "432 image-backed cases" },
  { icon: "🧠", text: "10 AI modes (Gemini 3 Flash)" },
  { icon: "📊", text: "Performance heatmap" },
  { icon: "⏱️", text: "Real 3.5-min ABO pacing" },
  { icon: "💎", text: "27 fatal-flaw safety nets" },
  { icon: "📖", text: "46 landmark trials cited inline" },
  { icon: "🏆", text: "ABO-authentic 3-domain scoring" },
  { icon: "🔬", text: "8-element PMP framework" },
];

interface FeatureMarqueeProps {
  chips?: FeatureChip[];
  durationSeconds?: number;
}

export default function FeatureMarquee({
  chips = DEFAULT_CHIPS,
  durationSeconds = 30,
}: FeatureMarqueeProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="relative my-8 overflow-hidden rounded-2xl border border-white/[0.04] bg-slate-950/40 py-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4">
          {chips.map((chip) => (
            <Chip key={chip.text} icon={chip.icon} text={chip.text} />
          ))}
        </div>
      </div>
    );
  }

  // Duplicate the chip list so the track translate of -50% lands on an
  // identical frame, hiding the seam.
  const track = [...chips, ...chips];

  return (
    <div
      className="feature-marquee group relative my-8 overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-r from-slate-950/60 via-slate-900/40 to-slate-950/60 py-4 backdrop-blur-sm"
      role="region"
      aria-label="Clear Vision Boards feature highlights"
    >
      {/* Edge fade gradients */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-950 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-950 to-transparent"
      />

      <div
        className="feature-marquee__track flex w-max items-center gap-6 pr-6"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {track.map((chip, i) => (
          <Chip key={`${chip.text}-${i}`} icon={chip.icon} text={chip.text} />
        ))}
      </div>

      {/* Scoped keyframes + pause-on-hover. Component-local via styled-jsx */}
      <style jsx>{`
        .feature-marquee__track {
          animation-name: cvb-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .feature-marquee:hover .feature-marquee__track,
        .feature-marquee:focus-within .feature-marquee__track {
          animation-play-state: paused;
        }
        @keyframes cvb-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function Chip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs text-slate-300 transition-colors hover:border-primary-500/30 hover:text-white">
      <span className="text-base leading-none" aria-hidden>
        {icon}
      </span>
      <span className="font-medium whitespace-nowrap">{text}</span>
    </div>
  );
}
