"use client";

import { useEffect, useRef } from "react";

/**
 * Radial emerald spotlight that follows the cursor. Attaches to a given
 * container ref. Disabled for touch devices and when reduced-motion is set.
 *
 * Drop into any section you want to highlight — hero especially.
 */
export default function SpotlightCursor({
  className = "",
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // touch → no spotlight
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const parent = el.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ${className}`}
      style={{
        background:
          "radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(16,163,127,0.18), transparent 40%)",
      }}
    />
  );
}
