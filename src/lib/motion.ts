"use client";

/**
 * Shared Framer Motion variants for Clear Vision Boards.
 *
 * All animations respect `prefers-reduced-motion` via framer-motion's
 * `useReducedMotion` hook (consumers wrap with MotionConfig if needed).
 *
 * Design language:
 *  - Entrance: gentle fade + rise (12-16px), 400-600ms
 *  - Stagger: 60-90ms between children
 *  - Spring: soft, ~280 stiffness, ~24 damping
 *  - Tap/hover: 1.02 scale max — never aggressive
 */

import type { Variants } from "framer-motion";

export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeSpring = [0.34, 1.56, 0.64, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

export const fadeUpSoft: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: easeOut } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: easeSpring } },
};

export const stagger = (staggerChildren = 0.075, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});

export const staggerFast = stagger(0.045, 0);
export const staggerMed = stagger(0.075, 0.1);
export const staggerSlow = stagger(0.12, 0.15);

/** A floating card that drifts gently — for ambient background decoration */
export const float: Variants = {
  show: {
    y: [0, -8, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

/** Quick chip/badge pulse */
export const pulseBadge: Variants = {
  show: {
    scale: [1, 1.04, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
};

/** Magnetic hover — consumers pass motion values directly */
export const hoverLift = {
  whileHover: { y: -3, transition: { duration: 0.25, ease: easeOut } },
  whileTap: { y: -1, scale: 0.99, transition: { duration: 0.1 } },
};

/** The "pill CTA" press feel */
export const hoverPress = {
  whileHover: { scale: 1.02, transition: { duration: 0.2, ease: easeOut } },
  whileTap: { scale: 0.98, transition: { duration: 0.08 } },
};
