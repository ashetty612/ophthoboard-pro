"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Infinite horizontal marquee of short clinical pearls. Sits below the
 * hero as an ambient texture conveying "clinical substance under the
 * surface." Duplicated track so the loop seams.
 */
const PEARLS = [
  "Painful Horner = dissection until proven otherwise",
  "Leukocoria = retinoblastoma until proven otherwise",
  "Any hypopyon = endophthalmitis until proven otherwise",
  "Elderly + sudden vision loss → ESR, CRP, platelets same visit",
  "Pupil-involving CN3 palsy → emergent CTA for PCom aneurysm",
  "Bilateral disc edema → MRI + MRV before LP",
  "Post-op pain = endophthalmitis until proven otherwise — tap and inject",
  "HZO + tip of nose (Hutchinson) → oral antiviral within 72h",
  "Flashes + floaters → dilated exam with scleral depression",
  "Per ONTT: no oral prednisone alone for optic neuritis",
  "Acute anterior uveitis + young male → HLA-B27 workup",
  "Chemical burn → irrigate BEFORE history-taking",
];

export default function PearlsMarquee({
  className = "",
}: {
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={`overflow-hidden py-4 border-y border-primary-600/10 bg-gradient-to-r from-slate-950/60 via-slate-900/40 to-slate-950/60 ${className}`}
      aria-label="Rotating clinical pearls"
    >
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={reduce ? undefined : { duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {[...PEARLS, ...PEARLS].map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-sm text-slate-400"
          >
            <svg
              viewBox="0 0 12 12"
              className="h-2 w-2 shrink-0 fill-primary-500"
              aria-hidden
            >
              <circle cx="6" cy="6" r="6" />
            </svg>
            <span>{p}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
