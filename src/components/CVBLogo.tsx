"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Clear Vision Boards logo — the brand's Clear Vision Education icon
 * (graduation cap over a green-iris almond eye) centered inside a
 * rotating motion ring with orbital dots.
 *
 * The inner icon is the real brand asset (public/mascots/cve-icon.png),
 * which carries a black background matching our dark slate theme. The
 * outer ring + orbital dots are CSS/SVG, so the rotation animation is
 * preserved exactly as before.
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

  // Inner icon fills ~68% of the frame (leaves breathing room for the
  // outer ring and the orbital dots to orbit cleanly around it).
  const iconSize = Math.round(size * 0.68);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Clear Vision Boards logo"
    >
      {/* Outer motion ring — green→teal→steel gradient stroke */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="cvb-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#047962" />
            <stop offset="100%" stopColor="#347896" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="27.5" stroke="url(#cvb-ring)" strokeWidth="1.6" fill="none" />
      </svg>

      {/* Center: the actual CVE cap+eye icon. Sits inside a rounded
          container with a subtle ring so it reads cleanly on very dark
          backgrounds too. */}
      <div
        className="absolute rounded-full overflow-hidden bg-slate-950 ring-1 ring-slate-800/60 shadow-[0_4px_16px_-4px_rgba(4,121,98,0.35)]"
        style={{
          width: iconSize,
          height: iconSize,
          left: (size - iconSize) / 2,
          top: (size - iconSize) / 2,
        }}
      >
        <Image
          src="/mascots/cve-icon.png"
          alt="Clear Vision Education"
          fill
          sizes={`${iconSize}px`}
          style={{ objectFit: "contain", objectPosition: "center 45%" }}
        />
      </div>

      {/* Orbital dots — rotate around the outer ring (DOM-positioned
          so the rotation is GPU-accelerated and stays crisp at any size). */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
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
