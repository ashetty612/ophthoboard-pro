"use client";

/**
 * Clear Vision Education logo — graduation cap over an eye with a green
 * iris. Rendered as inline SVG so it scales crisply and respects dark mode.
 *
 * The wordmark below the eye is optional (default: shown). Use with
 * `wordmark={false}` for icon-only contexts (favicon, small badges).
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
  const height = wordmark ? size : size * 0.55;
  const width = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox={wordmark ? "0 0 320 260" : "0 0 320 140"}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="cve-iris" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="60%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="cve-eyewhite" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5ead4" />
          <stop offset="100%" stopColor="#e8d6b4" />
        </linearGradient>
        <linearGradient id="cve-cap" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Graduation cap mortarboard — diamond shape with depth */}
      <g transform="translate(160 24)">
        {/* Mortarboard */}
        <path
          d="M -56 12 L 0 -12 L 56 12 L 0 36 Z"
          fill="url(#cve-cap)"
          stroke="#0b1220"
          strokeWidth="1.5"
        />
        {/* Inner diamond highlight */}
        <path
          d="M -44 12 L 0 -6 L 44 12 L 0 30 Z"
          fill="none"
          stroke="#2a3550"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Cap base */}
        <path
          d="M -22 18 Q 0 24 22 18 L 22 30 Q 0 36 -22 30 Z"
          fill="url(#cve-cap)"
          stroke="#0b1220"
          strokeWidth="1.5"
        />
        {/* Button on top center */}
        <circle cx="0" cy="12" r="2.5" fill="#f59e0b" />
        {/* Tassel — swings to the right */}
        <path
          d="M 0 12 Q 10 12 26 22 Q 32 24 34 30 L 32 40"
          stroke="#f59e0b"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="32" cy="42" rx="4" ry="6" fill="#f59e0b" />
      </g>

      {/* Eye — almond outline */}
      <g transform="translate(160 98)">
        <path
          d="M -70 0 Q 0 -40 70 0 Q 0 40 -70 0 Z"
          fill="url(#cve-eyewhite)"
          stroke="#0b2738"
          strokeWidth="4"
        />
        {/* Iris */}
        <circle cx="0" cy="0" r="26" fill="url(#cve-iris)" stroke="#064e3b" strokeWidth="1.5" />
        {/* Iris striations — radial lines */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 12;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 10}
              y1={Math.sin(a) * 10}
              x2={Math.cos(a) * 24}
              y2={Math.sin(a) * 24}
              stroke="#064e3b"
              strokeWidth="1"
              opacity="0.35"
            />
          );
        })}
        {/* Pupil */}
        <circle cx="0" cy="0" r="11" fill="#022c22" />
        {/* Catchlight */}
        <circle cx="8" cy="-8" r="3" fill="#ffffff" />
      </g>

      {/* Wordmark */}
      {wordmark && (
        <>
          <text
            x="160"
            y="196"
            textAnchor="middle"
            fontFamily="var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
            fontSize="36"
            fontWeight="800"
            letterSpacing="-0.01em"
            fill="#082a3e"
            stroke="#0f3447"
            strokeWidth="0.8"
          >
            CLEAR VISION
          </text>
          <text
            x="160"
            y="238"
            textAnchor="middle"
            fontFamily="var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
            fontSize="28"
            fontWeight="800"
            letterSpacing="0.04em"
            fill="#0d7f35"
          >
            EDUCATION
          </text>
        </>
      )}
    </svg>
  );
}
