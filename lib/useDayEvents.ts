"use client";

import { useEffect, useState } from "react";

import { mockDay, type ClassEvent, type SavedEvent } from "@/data/mock";
import { getScheduleForDate } from "@/lib/database/schedule";
import { useStoredState } from "@/lib/useStoredState";

// The same list of events the Today screen shows (demo classes minus deleted ones, with
// your edits, plus events saved in Supabase), sorted by start time.
export function useDayEvents(): ClassEvent[] {
  const [added, setAdded] = useState<SavedEvent[]>([]);
  const [hiddenIds] = useStoredState<string[]>("moway.hiddenEvents.v1", []);
  const [edits] = useStoredState<Record<string, ClassEvent>>("moway.eventEdits.v1", {});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const saved = await getScheduleForDate(mockDay.date);
        if (!active) return;
        setAdded(
          saved.map((event) => ({
            id: event.id,
            category: event.category,
            title: event.title,
            building: event.building,
            room: event.room ?? undefined,
            date: event.event_date,
            start: event.start_time,
            end: event.end_time,
          })),
        );
      } catch {
        // No schedule yet (offline or not signed in): the demo classes still show.
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const base = mockDay.events.filter((e) => !hiddenIds.includes(e.id)).map((e) => edits[e.id] ?? e);
  return [...base, ...added].sort((a, b) => a.start.localeCompare(b.start));
}
