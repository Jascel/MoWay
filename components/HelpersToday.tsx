"use client";

import { HeartHandshake } from "lucide-react";

import { useHelpersToday } from "@/lib/database/useHelpersToday";

export default function HelpersToday() {
  const count = useHelpersToday();
  if (count === null) return null;

  return (
    <p
      key={count}
      className="animate-fade-up flex items-center gap-3 rounded-3xl bg-white p-4 text-sm shadow-sm"
      aria-live="polite"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac/60">
        <HeartHandshake className="size-5 text-ink" aria-hidden />
      </span>
      {count === 0 ? (
        <span className="font-semibold">Be the first to help someone today</span>
      ) : (
        <span>
          <span className="font-display text-xl font-bold">{count}</span>{" "}
          <span className="font-semibold">{count === 1 ? "student has" : "students have"} helped today</span>
        </span>
      )}
    </p>
  );
}
