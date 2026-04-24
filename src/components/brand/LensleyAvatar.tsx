"use client";

import Image from "next/image";

/**
 * Lensley — the Chief Examiner mascot.
 *
 * Role: leads examiner-style modes (mock exam, viva, ddx drill, PMP
 * walk-through). Asks the questions the real ABO board will ask.
 * Holds a direct ophthalmoscope because he's spent more hours in
 * the chair than the board itself has existed.
 *
 * This is the canonical mascot image (brand/lensley.png) wrapped in
 * an `next/image`. Square crop via `object-cover` + `object-position`
 * so the character is well-framed even inside the small round avatars
 * used in the AI chat. The source is a taller-than-wide portrait, so
 * we anchor the crop to the top of the frame to preserve head+torso.
 */

interface Props {
  size?: number;
  className?: string;
  title?: string;
  /**
   * "portrait" shows the full body (hero/showcase usage).
   * "avatar" (default) crops to head + upper body for round bubbles.
   */
  framing?: "portrait" | "avatar";
}

export default function LensleyAvatar({
  size = 120,
  className = "",
  title = "Lensley — Chief Examiner",
  framing = "avatar",
}: Props) {
  const isPortrait = framing === "portrait";
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: isPortrait ? Math.round(size * 1.5) : size,
        // Warm beige studio backdrop (matches the source image) so the
        // char blends seamlessly when the round crop extends past the
        // character silhouette.
        backgroundColor: "#e6d9c0",
      }}
      aria-label={title}
      role="img"
    >
      <Image
        src="/mascots/lensley.png"
        alt={title}
        fill
        sizes={`${size}px`}
        priority={size >= 72}
        style={{
          objectFit: isPortrait ? "contain" : "cover",
          // In round-avatar mode, pin the image to the top so the
          // head + glasses + waving hand + upper lab coat dominate the
          // visible crop. Legs are cut (they don't matter in a bubble).
          objectPosition: isPortrait ? "center" : "center top",
        }}
      />
    </div>
  );
}
