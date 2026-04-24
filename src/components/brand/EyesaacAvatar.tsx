"use client";

/**
 * Eyesaac — the Co-Resident mascot.
 *
 * Role: your study partner for teaching modes — pearls, case-builder, ddx
 * drill, tutor mode. Always the first to raise a hand. Catches zebras
 * before you do and talks through management plans like the senior
 * resident you wish you had on call.
 *
 * Friendly 3D-cartoon interpretation of the reference art:
 *   - Cream egg head with soft spherical shading.
 *   - Brown pompadour swept up and back (volume on the forehead, tapers right).
 *   - Thick dark-brown eyebrows with arch.
 *   - BROWN round wire-frame glasses (thin brass frame).
 *   - BIG round blue eyes with two catchlights each.
 *   - Wide open-mouth grin showing teeth + tongue.
 *   - Green bow tie under the chin.
 *
 * Square 200x200 viewBox so the portrait centers inside its round crop.
 */

interface Props {
  size?: number;
  className?: string;
  title?: string;
}

export default function EyesaacAvatar({
  size = 120,
  className = "",
  title = "Eyesaac — Co-Resident",
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
        <radialGradient id="eye-head" cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#fbf4e4" />
          <stop offset="55%" stopColor="#f1e4ca" />
          <stop offset="100%" stopColor="#d9c4a3" />
        </radialGradient>
        {/* Hair — rich brown with a top-left highlight for shape */}
        <linearGradient id="eye-hair" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#5b3b22" />
          <stop offset="60%" stopColor="#3f2713" />
          <stop offset="100%" stopColor="#2a180b" />
        </linearGradient>
        <radialGradient id="eye-hair-sheen" cx="40%" cy="30%" r="45%">
          <stop offset="0%" stopColor="#8a5d36" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8a5d36" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="eye-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3a98f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f3a98f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="eye-iris" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#68a7da" />
          <stop offset="50%" stopColor="#2f78b0" />
          <stop offset="100%" stopColor="#17436c" />
        </radialGradient>
        <linearGradient id="eye-bowtie" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2bd46a" />
          <stop offset="100%" stopColor="#158a3e" />
        </linearGradient>
        <radialGradient id="eye-mouth" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#a73247" />
          <stop offset="100%" stopColor="#5b0f1d" />
        </radialGradient>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="100" cy="188" rx="60" ry="6" fill="#000" opacity="0.18" />

      {/* Shoulders (cream skin) for full chest framing */}
      <path
        d="M40 200 Q42 162 70 150 L92 146 Q100 144 108 146 L130 150 Q158 162 160 200 Z"
        fill="url(#eye-head)"
        stroke="#b99d74"
        strokeWidth="1.2"
      />

      {/* Green bow tie — right under the chin */}
      <g transform="translate(100 152)">
        <path
          d="M-24 -9 Q-10 -16 0 0 Q-10 16 -24 9 Q-20 0 -24 -9 Z"
          fill="url(#eye-bowtie)"
          stroke="#0d6b2f"
          strokeWidth="1.2"
        />
        <path
          d="M24 -9 Q10 -16 0 0 Q10 16 24 9 Q20 0 24 -9 Z"
          fill="url(#eye-bowtie)"
          stroke="#0d6b2f"
          strokeWidth="1.2"
        />
        {/* Center knot */}
        <rect x="-4" y="-5" width="8" height="10" rx="1.5" fill="#0d6b2f" />
        {/* Highlight on knot */}
        <rect x="-3" y="-4" width="2" height="8" rx="0.8" fill="#22a157" />
      </g>

      {/* Neck */}
      <rect x="92" y="135" width="16" height="16" fill="url(#eye-head)" />

      {/* HEAD */}
      <ellipse
        cx="100"
        cy="88"
        rx="66"
        ry="70"
        fill="url(#eye-head)"
        stroke="#b99d74"
        strokeWidth="1.2"
      />

      {/* Ears (behind hair on top, visible below the hair line) */}
      <ellipse cx="34" cy="94" rx="7" ry="11" fill="url(#eye-head)" stroke="#b99d74" strokeWidth="1" />
      <ellipse cx="166" cy="94" rx="7" ry="11" fill="url(#eye-head)" stroke="#b99d74" strokeWidth="1" />

      {/* HAIR — pompadour with volume on top, swept right.
          Two layers: base crown shape + dramatic front wave.           */}
      <g>
        {/* Base hair cap across the top of the head */}
        <path
          d="M 38 66
             Q 36 40 70 30
             Q 110 22 148 38
             Q 168 48 166 74
             L 162 70
             Q 152 52 132 50
             L 60 52
             Q 44 54 40 70
             Z"
          fill="url(#eye-hair)"
        />
        {/* Dramatic front pompadour wave — volume on forehead, tapered to the right ear */}
        <path
          d="M 56 54
             Q 56 22 96 20
             Q 136 22 150 40
             Q 154 52 142 50
             Q 134 36 108 34
             Q 82 34 70 48
             Q 62 56 56 54 Z"
          fill="url(#eye-hair)"
        />
        {/* Highlight sheen on the pompadour top */}
        <path
          d="M 66 38 Q 96 22 130 34 Q 120 26 96 26 Q 74 28 66 38 Z"
          fill="url(#eye-hair-sheen)"
        />
        {/* Side fade — sideburn-ish line */}
        <path
          d="M 40 70 Q 44 78 50 82"
          stroke="#2a180b"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 160 72 Q 156 82 150 86"
          stroke="#2a180b"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* Cheek blush */}
      <ellipse cx="52" cy="110" rx="14" ry="9" fill="url(#eye-cheek)" />
      <ellipse cx="148" cy="110" rx="14" ry="9" fill="url(#eye-cheek)" />

      {/* Eyebrows — bold, dark, arched */}
      <path
        d="M50 78 Q66 66 84 76"
        stroke="#2a180b"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M116 76 Q134 66 150 78"
        stroke="#2a180b"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* BROWN round wire-frame glasses */}
      <g>
        <circle cx="70" cy="98" r="24" fill="#ffffff" fillOpacity="0.88" />
        <circle cx="130" cy="98" r="24" fill="#ffffff" fillOpacity="0.88" />
        {/* Big blue eyes */}
        <circle cx="70" cy="98" r="14" fill="url(#eye-iris)" />
        <circle cx="70" cy="98" r="6" fill="#06121f" />
        <circle cx="66" cy="94" r="3.3" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="74" cy="101" r="1.4" fill="#ffffff" fillOpacity="0.8" />
        <circle cx="130" cy="98" r="14" fill="url(#eye-iris)" />
        <circle cx="130" cy="98" r="6" fill="#06121f" />
        <circle cx="126" cy="94" r="3.3" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="134" cy="101" r="1.4" fill="#ffffff" fillOpacity="0.8" />
        {/* Wire frames — warm brown */}
        <circle cx="70" cy="98" r="24" fill="none" stroke="#6b3f1f" strokeWidth="2.8" />
        <circle cx="130" cy="98" r="24" fill="none" stroke="#6b3f1f" strokeWidth="2.8" />
        {/* Frame inner highlight */}
        <path d="M58 88 Q66 82 78 86" stroke="#a4743f" strokeWidth="1.1" fill="none" />
        <path d="M118 88 Q126 82 138 86" stroke="#a4743f" strokeWidth="1.1" fill="none" />
        {/* Bridge */}
        <path d="M94 98 L106 98" stroke="#6b3f1f" strokeWidth="2.4" strokeLinecap="round" />
        {/* Temples */}
        <path d="M46 99 L34 94" stroke="#6b3f1f" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M154 99 L166 94" stroke="#6b3f1f" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* BIG open-mouth grin */}
      <g>
        <path
          d="M 62 132
             Q 100 164 138 132
             Q 100 148 62 132 Z"
          fill="url(#eye-mouth)"
          stroke="#3d0a13"
          strokeWidth="1.4"
        />
        {/* Teeth row */}
        <path
          d="M 64 132 Q 100 132 136 132 L 132 139 Q 100 137 68 139 Z"
          fill="#fbf9ef"
          stroke="#d8cfbb"
          strokeWidth="0.8"
        />
        <path d="M80 133 L80 138" stroke="#d8cfbb" strokeWidth="0.8" />
        <path d="M96 133 L96 138" stroke="#d8cfbb" strokeWidth="0.8" />
        <path d="M112 133 L112 138" stroke="#d8cfbb" strokeWidth="0.8" />
        <path d="M124 133 L124 138" stroke="#d8cfbb" strokeWidth="0.8" />
        {/* Tongue */}
        <ellipse cx="100" cy="150" rx="18" ry="6" fill="#d75c6c" opacity="0.88" />
        {/* Lip lower curve */}
        <path
          d="M 62 132 Q 100 158 138 132"
          stroke="#a23a49"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
