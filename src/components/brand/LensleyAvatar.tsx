"use client";

/**
 * Lensley — the Chief Examiner mascot.
 *
 * Role: leads examiner-style modes (mock exam, viva, ddx drill, PMP walk-
 * through). Asks the questions the real ABO board will ask. Holds a direct
 * ophthalmoscope because he's spent more hours in the chair than the
 * board itself has existed.
 *
 * Friendly 3D-cartoon interpretation of the reference art:
 *   - Bald cream/ivory egg head with soft spherical shading.
 *   - Thick black round glasses; BIG blue eyes with two catchlights each.
 *   - Wide open-mouth grin showing teeth + tongue.
 *   - Two brown eyebrow tufts — the ONLY hair.
 *   - White lab coat lapel peeking in at the bottom.
 *   - Direct ophthalmoscope held at the right side (mirror-head + handle).
 *
 * The viewBox is square (200x200) so the portrait centers cleanly inside
 * the `rounded-full overflow-hidden` wrappers its consumers use.
 */

interface Props {
  size?: number;
  className?: string;
  title?: string;
}

export default function LensleyAvatar({
  size = 120,
  className = "",
  title = "Lensley — Chief Examiner",
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        {/* Spherical skin shading — highlight top-left, fall-off bottom-right */}
        <radialGradient id="lens-head" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fbf4e4" />
          <stop offset="55%" stopColor="#f1e4ca" />
          <stop offset="100%" stopColor="#d9c4a3" />
        </radialGradient>
        {/* Cheek blush */}
        <radialGradient id="lens-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3a98f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f3a98f" stopOpacity="0" />
        </radialGradient>
        {/* Iris — blue with soft depth */}
        <radialGradient id="lens-iris" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#5fa0d4" />
          <stop offset="50%" stopColor="#2f73ab" />
          <stop offset="100%" stopColor="#173f66" />
        </radialGradient>
        {/* Lab coat */}
        <linearGradient id="lens-coat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbfaf5" />
          <stop offset="100%" stopColor="#e8e2d2" />
        </linearGradient>
        {/* Ophthalmoscope mirror + handle */}
        <linearGradient id="lens-instrument" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#55595f" />
          <stop offset="100%" stopColor="#25292f" />
        </linearGradient>
        {/* Mouth interior */}
        <radialGradient id="lens-mouth" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#a73247" />
          <stop offset="100%" stopColor="#5b0f1d" />
        </radialGradient>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="100" cy="188" rx="62" ry="6" fill="#000" opacity="0.18" />

      {/* Lab coat peeking at bottom (collar + V-lapel) */}
      <g>
        <path
          d="M40 200 Q40 162 70 150 L95 148 Q100 146 105 148 L130 150 Q160 162 160 200 Z"
          fill="url(#lens-coat)"
          stroke="#c9c0ae"
          strokeWidth="1.4"
        />
        {/* V-lapel seams */}
        <path d="M100 150 L82 196" stroke="#c9c0ae" strokeWidth="1.6" fill="none" />
        <path d="M100 150 L118 196" stroke="#c9c0ae" strokeWidth="1.6" fill="none" />
        {/* Subtle coat shadow at neck */}
        <path d="M93 148 Q100 155 107 148" stroke="#bcb29e" strokeWidth="1" fill="none" />
      </g>

      {/* Neck (cream skin) */}
      <rect x="92" y="135" width="16" height="18" fill="url(#lens-head)" />

      {/* HEAD — round/egg, slightly taller than wide */}
      <ellipse
        cx="100"
        cy="88"
        rx="68"
        ry="72"
        fill="url(#lens-head)"
        stroke="#b99d74"
        strokeWidth="1.2"
      />
      {/* Top scalp specular highlight — classic cartoon-bald shimmer */}
      <ellipse cx="80" cy="42" rx="26" ry="10" fill="#ffffff" opacity="0.35" />

      {/* Ears */}
      <ellipse cx="32" cy="92" rx="7" ry="11" fill="url(#lens-head)" stroke="#b99d74" strokeWidth="1" />
      <ellipse cx="168" cy="92" rx="7" ry="11" fill="url(#lens-head)" stroke="#b99d74" strokeWidth="1" />

      {/* Cheek blush */}
      <ellipse cx="52" cy="108" rx="14" ry="9" fill="url(#lens-cheek)" />
      <ellipse cx="148" cy="108" rx="14" ry="9" fill="url(#lens-cheek)" />

      {/* Eyebrows — short, thick, brown tufts */}
      <path
        d="M54 68 Q66 58 82 66"
        stroke="#4a2f18"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M118 66 Q134 58 146 68"
        stroke="#4a2f18"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Round BLACK glasses */}
      <g>
        {/* Frame shadow behind lens */}
        <circle cx="70" cy="95" r="24" fill="#ffffff" fillOpacity="0.88" />
        <circle cx="130" cy="95" r="24" fill="#ffffff" fillOpacity="0.88" />
        {/* Big blue eyes */}
        <circle cx="70" cy="95" r="13" fill="url(#lens-iris)" />
        <circle cx="70" cy="95" r="5.5" fill="#06121f" />
        <circle cx="66.5" cy="91.5" r="3" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="74" cy="98" r="1.3" fill="#ffffff" fillOpacity="0.8" />
        <circle cx="130" cy="95" r="13" fill="url(#lens-iris)" />
        <circle cx="130" cy="95" r="5.5" fill="#06121f" />
        <circle cx="126.5" cy="91.5" r="3" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="134" cy="98" r="1.3" fill="#ffffff" fillOpacity="0.8" />
        {/* Thick rims */}
        <circle cx="70" cy="95" r="24" fill="none" stroke="#0d0d0d" strokeWidth="4" />
        <circle cx="130" cy="95" r="24" fill="none" stroke="#0d0d0d" strokeWidth="4" />
        {/* Frame highlight */}
        <path d="M58 84 Q66 78 78 82" stroke="#3b3b3b" strokeWidth="1.6" fill="none" />
        <path d="M118 84 Q126 78 138 82" stroke="#3b3b3b" strokeWidth="1.6" fill="none" />
        {/* Bridge */}
        <path d="M94 95 L106 95" stroke="#0d0d0d" strokeWidth="3.5" strokeLinecap="round" />
        {/* Temples out to ears */}
        <path d="M46 96 L32 92" stroke="#0d0d0d" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M154 96 L168 92" stroke="#0d0d0d" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* BIG open-mouth grin */}
      <g>
        {/* Mouth cavity */}
        <path
          d="M 66 130
             Q 100 156 134 130
             Q 100 144 66 130 Z"
          fill="url(#lens-mouth)"
          stroke="#3d0a13"
          strokeWidth="1.4"
        />
        {/* Upper teeth row */}
        <path
          d="M 68 130 Q 100 130 132 130 L 128 137 Q 100 135 72 137 Z"
          fill="#fbf9ef"
          stroke="#d8cfbb"
          strokeWidth="0.8"
        />
        {/* Tooth seams */}
        <path d="M82 131 L82 136" stroke="#d8cfbb" strokeWidth="0.8" />
        <path d="M96 131 L96 136" stroke="#d8cfbb" strokeWidth="0.8" />
        <path d="M110 131 L110 136" stroke="#d8cfbb" strokeWidth="0.8" />
        <path d="M122 131 L122 136" stroke="#d8cfbb" strokeWidth="0.8" />
        {/* Tongue */}
        <ellipse cx="100" cy="145" rx="16" ry="5" fill="#d75c6c" opacity="0.85" />
        {/* Lips highlight (subtle) */}
        <path
          d="M 66 130 Q 100 150 134 130"
          stroke="#a23a49"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>

      {/* Ophthalmoscope peeking at right — handle + mirror head */}
      <g transform="translate(0, -4)">
        {/* Mirror head (disc) */}
        <ellipse cx="172" cy="152" rx="11" ry="9" fill="url(#lens-instrument)" stroke="#111" strokeWidth="1" />
        <circle cx="172" cy="152" r="4.5" fill="#0b0b0b" />
        <circle cx="170.5" cy="150.5" r="1.3" fill="#ffffff" opacity="0.5" />
        {/* Handle */}
        <rect x="168" y="160" width="8" height="30" rx="2.5" fill="url(#lens-instrument)" stroke="#111" strokeWidth="0.8" />
        {/* Knurl lines */}
        <line x1="168" y1="168" x2="176" y2="168" stroke="#16181c" strokeWidth="0.7" />
        <line x1="168" y1="174" x2="176" y2="174" stroke="#16181c" strokeWidth="0.7" />
        <line x1="168" y1="180" x2="176" y2="180" stroke="#16181c" strokeWidth="0.7" />
      </g>
    </svg>
  );
}
