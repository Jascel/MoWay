import { useId } from "react";

// The MoWay app icon: dark-green M with a white covering on a blue-to-mint square,
// plus a dotted route. The letter uses the Lilita One font (loaded in app/layout.tsx).
export function LogoMark({ size = 40 }: { size?: number }) {
  const id = useId();
  const letter = {
    x: 96,
    y: 138,
    textAnchor: "middle" as const,
    fontSize: 116,
    style: { fontFamily: "var(--font-lilita), cursive" },
  };
  return (
    <svg width={size} height={size} viewBox="0 0 192 192" role="img" aria-label="MoWay logo">
      <defs>
        <clipPath id={`${id}c`}>
          <rect width="192" height="192" rx="44" />
        </clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aee2ff" />
          <stop offset="1" stopColor="#c7eabb" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="192" height="192" fill={`url(#${id}g)`} />
      </g>
      <text {...letter} fill="#ffffff" stroke="#ffffff" strokeWidth="10" strokeLinejoin="round">M</text>
      <text {...letter} fill="#006747">M</text>
      <path
        d="M36 172 C 76 152, 112 186, 148 164"
        fill="none"
        stroke="#1f2a44"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="0.1 10"
      />
      <circle cx="152" cy="162" r="8" fill="#1f2a44" />
    </svg>
  );
}

// Icon + the name "MoWay" in the logo font.
export default function Logo({ size = 38 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-logo text-2xl text-ink">MoWay</span>
    </div>
  );
}
