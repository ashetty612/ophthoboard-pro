"use client";

import Image from "next/image";
import { Glasses } from "lucide-react";

type SubspecialtyId =
  | "anterior-segment"
  | "posterior-segment"
  | "neuro-ophthalmology"
  | "neuro-ophthalmology-and-orbit"
  | "pediatric-ophthalmology"
  | "optics";

interface PhotoEntry {
  src: string;
  alt: string;
  position?: string;
  scale?: number;
}

const PHOTOS: Partial<Record<SubspecialtyId, PhotoEntry>> = {
  "anterior-segment": {
    src: "/images/pdf_45_0.jpeg",
    alt: "Slit-lamp photograph showing the central lens with diagnostic blue beam",
    position: "42% 38%",
    scale: 1.7,
  },
  "posterior-segment": {
    src: "/images/page_88_img_Image287.jpg",
    alt: "Fundus photograph",
    position: "30% 55%",
    scale: 1.45,
  },
  "neuro-ophthalmology": {
    src: "/images/page_146_img_Image433.jpg",
    alt: "External photograph showing anisocoria",
    position: "50% 50%",
    scale: 1.4,
  },
  "neuro-ophthalmology-and-orbit": {
    src: "/images/page_146_img_Image433.jpg",
    alt: "External photograph showing anisocoria",
    position: "50% 50%",
    scale: 1.4,
  },
  "pediatric-ophthalmology": {
    src: "/images/page_180_img_Image517.jpg",
    alt: "Pediatric external photograph",
    position: "50% 50%",
    scale: 1.55,
  },
};

export interface SubspecialtyIconProps {
  id: string;
  /** Tailwind gradient classes for the overlay tint (e.g. "from-cyan-500 to-blue-600"). */
  gradient: string;
  /** Tailwind sizing classes — defaults match the 44px subspecialty chip. */
  className?: string;
}

/**
 * Real ophthalmology photographs as the subspecialty icon — fundus for
 * posterior, slit-lamp for anterior, external for neuro & pediatric.
 * Optics has no representative case photo, so we render an inline icon.
 *
 * The photo sits inside the existing rounded chip, tinted with the chip's
 * gradient so it reads as part of the design system rather than a stock
 * photo dropped in.
 */
export default function SubspecialtyIcon({ id, gradient, className = "h-11 w-11 rounded-lg" }: SubspecialtyIconProps) {
  const entry = PHOTOS[id as SubspecialtyId];

  if (!entry) {
    return (
      <div
        className={`${className} relative overflow-hidden bg-gradient-to-br ${gradient} shadow-lg flex items-center justify-center`}
        aria-hidden
      >
        <Glasses className="h-5 w-5 text-white drop-shadow" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div
      className={`${className} relative overflow-hidden bg-gradient-to-br ${gradient} shadow-lg ring-1 ring-white/10`}
      aria-hidden
    >
      <Image
        src={entry.src}
        alt={entry.alt}
        fill
        sizes="56px"
        loading="eager"
        priority
        style={{
          objectFit: "cover",
          objectPosition: entry.position ?? "50% 50%",
          transform: entry.scale ? `scale(${entry.scale})` : undefined,
        }}
        className="transition-transform duration-700 ease-out group-hover:scale-[1.18]"
      />
      {/* Subtle brand-tint — soft-light preserves photo detail while
          pulling the icon into the chip's color family. */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 mix-blend-soft-light`}
      />
      {/* Bottom shadow for depth + readability against any neighbor */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      {/* Inner highlight ring for the glass-chip feel */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20" />
    </div>
  );
}
