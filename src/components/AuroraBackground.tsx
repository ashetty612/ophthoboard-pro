"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Aurora-mesh background — drifting emerald + steel-blue gradient blobs.
 * Sits behind page content with z=-1. Respects prefers-reduced-motion.
 *
 * Inspired by the "aurora" pattern from Linear/Vercel/Aceternity UI, but
 * tuned to Clear Vision Ed's emerald+steel brand (not purple-pink).
 */
export default function AuroraBackground({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : 18;

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Emerald blob — top-left */}
      <motion.div
        className="absolute -top-40 -left-40 h-[50vh] w-[50vh] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, #047962 0%, transparent 65%)",
        }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, 60, -20, 0],
                y: [0, 30, 60, 0],
              }
        }
        transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Steel-blue blob — bottom-right */}
      <motion.div
        className="absolute -bottom-60 -right-40 h-[55vh] w-[55vh] rounded-full opacity-35 blur-3xl"
        style={{
          background: "radial-gradient(circle, #347896 0%, transparent 65%)",
        }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, -50, 20, 0],
                y: [0, -30, -60, 0],
              }
        }
        transition={{ duration: duration + 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Teal accent — center */}
      <motion.div
        className="absolute top-1/3 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, #10a37f 0%, transparent 70%)",
        }}
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.2, 1],
              }
        }
        transition={{ duration: duration - 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Subtle noise grain for texture (SVG turbulence) */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="aurora-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#aurora-noise)" />
      </svg>
    </div>
  );
}
