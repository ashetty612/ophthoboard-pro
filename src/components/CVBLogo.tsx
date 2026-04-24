"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Clear Vision Boards logo — graduation cap + almond eye (Clear Vision
 * Education brand mark) inside a rotating motion ring with orbital dots.
 *
 * The central art matches the CVE logo (graduation cap w/ orange tassel
 * over a navy-outlined almond eye with a green iris). The ring + dots
 * keep the "alive" rotational motion people associate with the product.
 */
export default function CVBLogo({
  size = 56,
  animate = true,
  className = "",
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const spin = animate && !reduce;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Clear Vision Boards logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="cvb-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#047962" />
            <stop offset="100%" stopColor="#347896" />
          </linearGradient>
          <radialGradient id="cvb-iris" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="55%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>
          <linearGradient id="cvb-eyewhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f7ecd4" />
            <stop offset="100%" stopColor="#e2cfa5" />
          </linearGradient>
          <linearGradient id="cvb-cap" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#0b1220" />
          </linearGradient>
        </defs>

        {/* Outer motion ring */}
        <circle cx="36" cy="36" r="32" stroke="url(#cvb-ring)" strokeWidth="2" fill="none" />

        {/* Graduation cap — diamond mortarboard + base + tassel */}
        <g>
          {/* Mortarboard */}
          <path
            d="M 22 18 L 36 11 L 50 18 L 36 25 Z"
            fill="url(#cvb-cap)"
            stroke="#0b1220"
            strokeWidth="0.8"
          />
          {/* Inner diamond highlight */}
          <path
            d="M 26 18 L 36 13.5 L 46 18 L 36 22.5 Z"
            fill="none"
            stroke="#2a3550"
            strokeWidth="0.6"
            opacity="0.7"
          />
          {/* Cap base (under-brim) */}
          <path
            d="M 28 23 Q 36 26 44 23 L 44 27 Q 36 30 28 27 Z"
            fill="url(#cvb-cap)"
            stroke="#0b1220"
            strokeWidth="0.8"
          />
          {/* Button */}
          <circle cx="36" cy="18" r="1.1" fill="#f59e0b" />
          {/* Tassel swinging right */}
          <path
            d="M 36 18 Q 44 18 50 24 Q 52 26 52 30"
            stroke="#f59e0b"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="52" cy="31.5" rx="1.6" ry="2.4" fill="#f59e0b" />
        </g>

        {/* Almond eye with green iris */}
        <g transform="translate(36 45)">
          {/* Sclera */}
          <path
            d="M -22 0 Q 0 -14 22 0 Q 0 14 -22 0 Z"
            fill="url(#cvb-eyewhite)"
            stroke="#0b2738"
            strokeWidth="1.8"
          />
          {/* Iris */}
          <circle cx="0" cy="0" r="10" fill="url(#cvb-iris)" stroke="#064e3b" strokeWidth="0.6" />
          {/* Iris striations (subtle) */}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 10;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 4}
                y1={Math.sin(a) * 4}
                x2={Math.cos(a) * 9}
                y2={Math.sin(a) * 9}
                stroke="#064e3b"
                strokeWidth="0.4"
                opacity="0.4"
              />
            );
          })}
          {/* Pupil */}
          <circle cx="0" cy="0" r="4" fill="#042f26" />
          {/* Catchlight */}
          <circle cx="2.5" cy="-2.5" r="1.3" fill="#ffffff" />
          <circle cx="-3" cy="2.5" r="0.6" fill="#ffffff" fillOpacity="0.7" />
        </g>
      </svg>

      {/* Orbital dots — rotate around the outer ring */}
      <motion.div
        className="absolute inset-0"
        animate={spin ? { rotate: 360 } : undefined}
        transition={spin ? { duration: 24, repeat: Infinity, ease: "linear" } : undefined}
      >
        <span
          className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
        />
        <span
          className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-steel-400 shadow-[0_0_6px_rgba(79,138,165,0.5)]"
        />
      </motion.div>
    </div>
  );
}
