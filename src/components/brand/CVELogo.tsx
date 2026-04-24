"use client";

import Image from "next/image";

/**
 * Clear Vision Education logo — the canonical brand mark (graduation
 * cap over an almond eye with a green iris, plus the "Clear Vision
 * Education" wordmark).
 *
 * Wraps the brand image from `public/mascots/`. Pass `wordmark={false}`
 * for the icon-only variant (favicon, small badges, the spinning-ring
 * CVBLogo). The image has a black background that blends with the
 * site's dark theme, so no transparency masking is needed.
 */

interface Props {
  size?: number;
  wordmark?: boolean;
  className?: string;
  title?: string;
}

export default function CVELogo({
  size = 140,
  wordmark = true,
  className = "",
  title = "Clear Vision Education",
}: Props) {
  // Aspect ratios come from the processed source files:
  //   cve.png       → 720×431 (wordmark + icon), aspect ≈ 1.67
  //   cve-icon.png  → 340×360 (icon only), aspect ≈ 0.94
  const src = wordmark ? "/mascots/cve.png" : "/mascots/cve-icon.png";
  const aspect = wordmark ? 431 / 720 : 360 / 340;
  const width = size;
  const height = Math.round(size * aspect);

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height }}
      aria-label={title}
      role="img"
    >
      <Image
        src={src}
        alt={title}
        fill
        sizes={`${size}px`}
        priority={size >= 120}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
