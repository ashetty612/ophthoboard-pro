"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Clear Vision Boards logo — a stylized eye with iris gradient and
 * orbital dots. Sized via the `size` prop in px. The orbital dots
 * rotate gently unless reduced-motion is set.
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
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="cvb-iris" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#047962" />
            <stop offset="100%" stopColor="#347896" />
          </linearGradient>
          <radialGradient id="cvb-pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020a13" />
            <stop offset="100%" stopColor="#0b1a2c" />
          </radialGradient>
        </defs>
        {/* Outer ring */}
        <circle cx="30" cy="30" r="26" stroke="url(#cvb-iris)" strokeWidth="2" fill="none" />
        {/* Iris disc */}
        <circle cx="30" cy="30" r="14" fill="url(#cvb-iris)" opacity="0.95" />
        {/* Pupil */}
        <circle cx="30" cy="30" r="6" fill="url(#cvb-pupil)" />
        {/* Catchlight */}
        <circle cx="27.5" cy="27.5" r="1.8" fill="white" fillOpacity="0.65" />
      </svg>
      {/* Orbital dots */}
      <motion.div
        className="absolute inset-0"
        animate={spin ? { rotate: 360 } : undefined}
        transition={spin ? { duration: 24, repeat: Infinity, ease: "linear" } : undefined}
      >
        <span
          className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
        />
        <span
          className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-steel-400 shadow-[0_0_6px_rgba(79,138,165,0.5)]"
        />
      </motion.div>
    </div>
  );
}
