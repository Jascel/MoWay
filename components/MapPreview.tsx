// Stand-in "map" drawn with SVG, styled like the reference: soft gray streets,
// a dotted route, and two pins. It gets replaced by Andres's real Google map.
// The thin dark-green border is the USF touch.
export default function MapPreview({ from, to }: { from: string; to: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-usf-green bg-[#eef0f2]">
      <svg viewBox="0 0 360 240" className="block w-full" role="img" aria-label={`Route from ${from} to ${to}`}>
        <rect width="360" height="240" fill="#eef0f2" />
        <g fill="#e1e5e8">
          <rect x="14" y="16" width="86" height="60" rx="8" />
          <rect x="118" y="16" width="70" height="44" rx="8" />
          <rect x="206" y="24" width="130" height="52" rx="8" />
          <rect x="14" y="96" width="70" height="52" rx="8" />
          <rect x="230" y="100" width="100" height="60" rx="8" />
          <rect x="30" y="170" width="120" height="54" rx="8" />
          <rect x="170" y="176" width="150" height="48" rx="8" />
        </g>
        <path d="M250 120 q30 -14 70 -2 v30 q-40 12 -70 -2 z" fill="#d6e9f5" />
        <g stroke="#ffffff" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M0 86 H360" />
          <path d="M0 160 H360" />
          <path d="M108 0 V240" />
          <path d="M196 0 V240" />
          <path d="M340 0 V240" />
        </g>
        <path
          d="M56 170 C56 130 100 140 108 110 S190 100 220 86 S300 70 300 50"
          fill="none"
          stroke="#006747"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="0.1 10"
        />
        <circle cx="56" cy="170" r="11" fill="#ffffff" stroke="#006747" strokeWidth="4" />
        <circle cx="300" cy="50" r="11" fill="#fee2ad" stroke="#006747" strokeWidth="4" />
        <g fontSize="11" fontWeight="600" fill="#1f2a44">
          <rect x="70" y="180" width={from.length * 6.4 + 16} height="20" rx="10" fill="#ffffff" />
          <text x="78" y="194">{from}</text>
          <rect x={296 - to.length * 6.4 - 16} y="58" width={to.length * 6.4 + 16} height="20" rx="10" fill="#ffffff" />
          <text x={304 - to.length * 6.4 - 16} y="72">{to}</text>
        </g>
      </svg>
    </div>
  );
}
