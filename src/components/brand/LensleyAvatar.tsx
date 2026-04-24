"use client";

/**
 * Lensley — the bald lab-coated attending mascot.
 * Round head, round black-rimmed glasses, white lab coat, holds a small
 * ophthalmology instrument (direct ophthalmoscope). Drawn as inline SVG
 * for crisp scaling and dark-mode control.
 */

interface Props {
  size?: number;
  className?: string;
  title?: string;
}

export default function LensleyAvatar({
  size = 120,
  className = "",
  title = "Lensley, Clear Vision attending",
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="lens-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4e7d6" />
          <stop offset="100%" stopColor="#e8d6bf" />
        </linearGradient>
        <linearGradient id="lens-coat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8f5ee" />
          <stop offset="100%" stopColor="#e4ddcf" />
        </linearGradient>
        <radialGradient id="lens-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0a897" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f0a897" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lens-instrument" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a4d52" />
          <stop offset="100%" stopColor="#2a2d32" />
        </linearGradient>
      </defs>

      {/* Coat — shoulders only (avatar crop) */}
      <path
        d="M20 230 Q20 180 50 165 L80 158 Q100 155 120 158 L150 165 Q180 180 180 230 Z"
        fill="url(#lens-coat)"
        stroke="#cfc7b7"
        strokeWidth="1.5"
      />
      {/* Coat V — lapel seam */}
      <path
        d="M100 165 L85 200 M100 165 L115 200"
        stroke="#cfc7b7"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Collar triangle */}
      <path
        d="M95 165 L100 180 L105 165 Z"
        fill="#dfd6c3"
        stroke="#cfc7b7"
        strokeWidth="1"
      />
      {/* Neck */}
      <rect x="92" y="148" width="16" height="18" fill="url(#lens-skin)" />

      {/* Head — bald, round, slightly taller than wide */}
      <ellipse cx="100" cy="92" rx="65" ry="70" fill="url(#lens-skin)" stroke="#b69d7c" strokeWidth="1" />

      {/* Subtle cheek blush */}
      <ellipse cx="55" cy="108" rx="14" ry="10" fill="url(#lens-cheek)" />
      <ellipse cx="145" cy="108" rx="14" ry="10" fill="url(#lens-cheek)" />

      {/* Eyebrows */}
      <path d="M55 75 Q65 70 80 75" stroke="#6b4d32" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M120 75 Q135 70 145 75" stroke="#6b4d32" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Round glasses — black frames */}
      <circle cx="72" cy="98" r="22" fill="#ffffff" fillOpacity="0.85" stroke="#111" strokeWidth="3.5" />
      <circle cx="128" cy="98" r="22" fill="#ffffff" fillOpacity="0.85" stroke="#111" strokeWidth="3.5" />
      <path d="M93 98 L107 98" stroke="#111" strokeWidth="3" />

      {/* Pupils — blue */}
      <circle cx="72" cy="98" r="8" fill="#2b5a8e" />
      <circle cx="72" cy="98" r="3.5" fill="#0b1a2c" />
      <circle cx="70" cy="95.5" r="1.8" fill="#ffffff" fillOpacity="0.9" />
      <circle cx="128" cy="98" r="8" fill="#2b5a8e" />
      <circle cx="128" cy="98" r="3.5" fill="#0b1a2c" />
      <circle cx="126" cy="95.5" r="1.8" fill="#ffffff" fillOpacity="0.9" />

      {/* Smile */}
      <path
        d="M74 138 Q100 158 126 138 Q100 145 74 138 Z"
        fill="#6b1a1a"
        stroke="#4a0d0d"
        strokeWidth="1"
      />
      <path
        d="M74 138 Q100 152 126 138"
        stroke="#ffffff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Instrument in hand — peeking from right side */}
      <g>
        <rect x="165" y="190" width="8" height="30" rx="2" fill="url(#lens-instrument)" />
        <ellipse cx="169" cy="186" rx="10" ry="7" fill="url(#lens-instrument)" />
        <circle cx="169" cy="186" r="3" fill="#111" />
      </g>
    </svg>
  );
}
