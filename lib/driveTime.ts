"use client";

import { useEffect, useState } from "react";
import { useStoredState } from "@/lib/useStoredState";
import { CAMPUS_CENTER } from "@/lib/campus";

// Campus stands in as the Marshall Student Center. Andres's Google Routes work can replace this
// with real traffic and the exact parking lot later.
const CAMPUS = CAMPUS_CENTER;

export type DriveEstimate = { address: string; minutes: number; miles: number };

// Address -> coordinates (OpenStreetMap Nominatim) -> driving route (OSRM public demo server).
// Both are free and need no key. There's no live traffic, so this is a typical-drive estimate.
export async function estimateDrive(address: string): Promise<{ minutes: number; miles: number } | null> {
  const query = /\b(fl|florida)\b/i.test(address) ? address : `${address}, Tampa, FL`;
  const geo = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  );
  const places = (await geo.json()) as { lat: string; lon: string }[];
  if (!places.length) return null;

  const { lat, lon } = places[0];
  const route = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${lon},${lat};${CAMPUS.lng},${CAMPUS.lat}?overview=false`
  );
  const data = (await route.json()) as { routes?: { duration: number; distance: number }[] };
  const best = data.routes?.[0];
  if (!best) return null;

  return { minutes: Math.max(1, Math.round(best.duration / 60)), miles: best.distance / 1609.344 };
}

// Gives the drive time from the typed address. Looks it up once (after you stop typing)
// and remembers the answer in the browser, so every screen can show it.
export function useDriveEstimate(address: string) {
  const [cache, saveCache] = useStoredState<DriveEstimate | null>("moway.driveEstimate.v1", null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const trimmed = address.trim();
  const cachedFor = cache?.address;

  useEffect(() => {
    if (!trimmed || cachedFor === trimmed) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const result = await estimateDrive(trimmed);
        if (cancelled) return;
        if (result) {
          saveCache({ address: trimmed, ...result });
          setStatus("idle");
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, cachedFor, saveCache]);

  const estimate = trimmed && cache?.address === trimmed ? cache : null;
  return { minutes: estimate?.minutes ?? null, miles: estimate?.miles ?? null, status: trimmed ? status : "idle" };
}
