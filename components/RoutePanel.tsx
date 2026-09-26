"use client";

import { useState } from "react";
import type { DayPlan } from "@/data/mock";
import RouteChips from "@/components/RouteChips";
import { formatTime, minusMinutes } from "@/lib/time";

// Route info panel that sits under the map. Pick a leg of your day at the top and it
// shows where you're going, how long it takes, when to leave, and why (the chips).
// Later the numbers and chips come from Andres's routing instead of mock data.
export default function RoutePanel({ day }: { day: DayPlan }) {
  // Start on the leg that has a "+3 min" chip so the demo shows something interesting.
  const firstAffected = day.legs.findIndex((l) => l.tags.some((t) => t.startsWith("+")));
  const [index, setIndex] = useState(firstAffected >= 0 ? firstAffected : 0);

  function placeName(id: string) {
    if (id === "parking") return day.parking.garage;
    if (id === "home") return "Home";
    return day.events.find((e) => e.id === id)?.title ?? id;
  }

  const leg = day.legs[index];
  const destination = day.events.find((e) => e.id === leg.toEventId);
  const miles = (leg.distanceMeters / 1609.344).toFixed(1);
  const verb = leg.steps ? "total" : leg.mode === "drive" ? "drive" : "walk";

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {day.legs.map((l, i) => (
          <button
            key={l.toEventId}
            onClick={() => setIndex(i)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
              i === index
                ? "border-usf-green bg-usf-green text-white"
                : "border-gray-300 bg-white text-gray-600"
            }`}
          >
            To {placeName(l.toEventId)}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-600">
        {placeName(leg.fromEventId)} → {placeName(leg.toEventId)}
        {destination && ` (${destination.building}${destination.room ? ` ${destination.room}` : ""})`}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xl font-bold">{leg.minutes} min</p>
          <p className="text-xs text-gray-500">{verb}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xl font-bold">{miles} mi</p>
          <p className="text-xs text-gray-500">distance</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xl font-bold">
            {destination ? formatTime(minusMinutes(destination.start, leg.minutes)).replace(" ", "") : "-"}
          </p>
          <p className="text-xs text-gray-500">leave by</p>
        </div>
      </div>

      {leg.steps && (
        <ul className="mt-3 space-y-1 text-sm text-gray-700">
          {leg.steps.map((step) => (
            <li key={step.label}>
              {step.mode === "drive" ? "🚗" : "🚶"} {step.label} ({step.minutes} min)
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <RouteChips tags={leg.tags} />
      </div>
    </section>
  );
}
