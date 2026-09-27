"use client";

import { useEffect, useState } from "react";

// Soft pastel confetti that falls once and removes itself. Positions come from the piece
// number (no randomness), so it looks the same every time.
const colors = ["bg-mint", "bg-aqua", "bg-sun", "bg-blush", "bg-coral", "bg-rose", "bg-lilac"];
const PIECES = 36;

export default function Confetti() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: PIECES }, (_, i) => (
        <span
          key={i}
          className={`animate-confetti absolute top-0 block rounded-sm ${colors[i % colors.length]}`}
          style={{
            left: `${(i * 37) % 100}%`,
            width: `${8 + (i % 3) * 3}px`,
            height: `${12 + (i % 4) * 3}px`,
            animationDelay: `${(i % 9) * 0.09}s`,
            animationDuration: `${2 + (i % 5) * 0.25}s`,
            ["--drift" as string]: `${((i % 7) - 3) * 18}px`,
            ["--spin" as string]: `${(i % 2 ? 1 : -1) * (360 + (i % 4) * 90)}deg`,
          }}
        />
      ))}
    </div>
  );
}
