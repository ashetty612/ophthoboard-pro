"use client";

/**
 * Eyesaac — the enthusiastic student mascot.
 * Brown swept-back hair, round brass glasses, big blue eyes, green bow tie,
 * one finger raised as if saying "oh oh I know!" Drawn as inline SVG.
 */

interface Props {
  size?: number;
  className?: string;
  title?: string;
}

export default function EyesaacAvatar({
  size = 120,
  className = "",
  title = "Eyesaac, Clear Vision student",
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
        <linearGradient id="eye-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4e7d6" />
          <stop offset="100%" stopColor="#e8d6bf" />
        </linearGradient>
        <linearGradient id="eye-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5a3a21" />
          <stop offset="100%" stopColor="#3e2612" />
        </linearGradient>
        <linearGradient id="eye-bowtie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <radialGradient id="eye-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0a897" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f0a897" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Neck */}
      <rect x="92" y="148" width="16" height="18" fill="url(#eye-skin)" />

      {/* Shoulders — casual beige */}
      <path
        d="M28 230 Q28 186 58 170 L80 164 Q100 162 120 164 L142 170 Q172 186 172 230 Z"
        fill="url(#eye-skin)"
        stroke="#b69d7c"
        strokeWidth="1"
      />

      {/* Green bow tie */}
      <g transform="translate(100 168)">
        <path
          d="M-22 -8 Q-10 -14 0 0 Q-10 14 -22 8 Q-18 0 -22 -8 Z"
          fill="url(#eye-bowtie)"
          stroke="#15803d"
          strokeWidth="1"
        />
        <path
          d="M22 -8 Q10 -14 0 0 Q10 14 22 8 Q18 0 22 -8 Z"
          fill="url(#eye-bowtie)"
          stroke="#15803d"
          strokeWidth="1"
        />
        <rect x="-3" y="-4" width="6" height="8" rx="1" fill="#15803d" />
      </g>

      {/* Head */}
      <ellipse cx="100" cy="92" rx="65" ry="70" fill="url(#eye-skin)" stroke="#b69d7c" strokeWidth="1" />

      {/* Hair — swept back with volume on top */}
      <path
        d="M 34 62 Q 40 30 78 26 Q 110 24 138 34 Q 168 44 166 72 Q 168 44 150 52 Q 144 48 138 50 L 60 48 Q 44 48 38 64 Z"
        fill="url(#eye-hair)"
      />
      {/* Hair volume on crown */}
      <path
        d="M 68 32 Q 82 16 108 22 Q 128 28 132 36 Q 110 28 86 34 Q 74 38 68 32 Z"
        fill="url(#eye-hair)"
      />

      {/* Cheek blush */}
      <ellipse cx="55" cy="110" rx="14" ry="10" fill="url(#eye-cheek)" />
      <ellipse cx="145" cy="110" rx="14" ry="10" fill="url(#eye-cheek)" />

      {/* Bold eyebrows */}
      <path d="M50 78 Q65 72 82 78" stroke="#3e2612" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M118 78 Q135 72 150 78" stroke="#3e2612" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* Round glasses — brass frame */}
      <circle cx="72" cy="100" r="24" fill="#ffffff" fillOpacity="0.85" stroke="#8a5a2a" strokeWidth="3.5" />
      <circle cx="128" cy="100" r="24" fill="#ffffff" fillOpacity="0.85" stroke="#8a5a2a" strokeWidth="3.5" />
      <path d="M96 100 L104 100" stroke="#8a5a2a" strokeWidth="3" />

      {/* Big blue eyes */}
      <circle cx="72" cy="100" r="12" fill="#2e7ab8" />
      <circle cx="72" cy="100" r="5" fill="#0b1a2c" />
      <circle cx="69.5" cy="97" r="2.5" fill="#ffffff" fillOpacity="0.95" />
      <circle cx="128" cy="100" r="12" fill="#2e7ab8" />
      <circle cx="128" cy="100" r="5" fill="#0b1a2c" />
      <circle cx="125.5" cy="97" r="2.5" fill="#ffffff" fillOpacity="0.95" />

      {/* Big grin */}
      <path
        d="M65 138 Q100 165 135 138 Q100 150 65 138 Z"
        fill="#6b1a1a"
        stroke="#4a0d0d"
        strokeWidth="1"
      />
      <path
        d="M65 138 L135 138"
        stroke="#ffffff"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
