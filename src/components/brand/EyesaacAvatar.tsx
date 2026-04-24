"use client";

import Image from "next/image";

/**
 * Eyesaac — the Co-Resident mascot.
 *
 * Role: your study partner for teaching modes — pearls, case-builder,
 * ddx drill, tutor mode. Always the first to raise a hand. Catches
 * zebras before you do and talks through management plans like the
 * senior resident you wish you had on call.
 *
 * Canonical mascot image (brand/eyesaac.png) wrapped in next/image,
 * with the same cropping rules as LensleyAvatar so the two portraits
 * line up visually side-by-side.
 */

interface Props {
  size?: number;
  className?: string;
  title?: string;
  /** "portrait" shows the full body; "avatar" (default) crops round-friendly. */
  framing?: "portrait" | "avatar";
}

export default function EyesaacAvatar({
  size = 120,
  className = "",
  title = "Eyesaac — Co-Resident",
  framing = "avatar",
}: Props) {
  const isPortrait = framing === "portrait";
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: isPortrait ? Math.round(size * 1.5) : size,
        backgroundColor: "#d8c597",
      }}
      aria-label={title}
      role="img"
    >
      <Image
        src="/mascots/eyesaac.png"
        alt={title}
        fill
        sizes={`${size}px`}
        priority={size >= 72}
        style={{
          objectFit: isPortrait ? "contain" : "cover",
          // Pin to top so the pompadour + face + pointing finger +
          // green bow tie are all in the visible crop. Legs get cut
          // (irrelevant for avatar framing).
          objectPosition: isPortrait ? "center" : "center top",
        }}
      />
    </div>
  );
}
