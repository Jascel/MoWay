"use client";

import { useEffect, useMemo, useState } from "react";

import { mockDay, type ClassEvent, type SavedEvent } from "@/data/mock";
import {
  deleteScheduleEvent,
  getScheduleForDate,
  updateScheduleEvent,
} from "@/lib/database/schedule";
import { useStoredState } from "@/lib/useStoredState";

export type DaySchedule = {
  readonly events: readonly ClassEvent[];
  readonly added: readonly SavedEvent[];
  readonly setAdded: React.Dispatch<React.SetStateAction<SavedEvent[]>>;
  readonly hiddenIds: readonly string[];
  readonly saveHidden: (value: string[]) => void;
  readonly edits: Readonly<Record<string, ClassEvent>>;
  readonly saveEdits: (value: Record<string, ClassEvent>) => void;
  readonly hiddenCount: number;
  readonly loaded: boolean;
  readonly deleteEvent: (event: ClassEvent) => Promise<void>;
  readonly saveEdit: (event: ClassEvent) => Promise<void>;
};

export function useDaySchedule(date: string = mockDay.date): DaySchedule {
  const [added, setAdded] = useState<SavedEvent[]>([]);
  const [hiddenIds, saveHidden] = useStoredState<string[]>("moway.hiddenEvents.v1", []);
  const [edits, saveEdits] = useStoredState<Record<string, ClassEvent>>("moway.eventEdits.v1", {});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSchedule(): Promise<void> {
      try {
        const savedEvents = await getScheduleForDate(date);
        if (!active) return;

        setAdded(
          savedEvents.map((event) => ({
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
      } catch (error) {
        if (active) console.error("Could not load schedule:", error);
      } finally {
        if (active) setLoaded(true);
      }
    }

    void loadSchedule();
    return () => {
      active = false;
    };
  }, [date]);

  const baseEvents = useMemo(
    () => mockDay.events.filter((event) => !hiddenIds.includes(event.id)).map((event) => edits[event.id] ?? event),
    [edits, hiddenIds],
  );

  const events = useMemo(
    () => [...baseEvents, ...added].sort((a, b) => a.start.localeCompare(b.start)),
    [added, baseEvents],
  );

  async function deleteEvent(event: ClassEvent): Promise<void> {
    if (added.some((saved) => saved.id === event.id)) {
      try {
        await deleteScheduleEvent(event.id);
        setAdded((previous) => previous.filter((saved) => saved.id !== event.id));
      } catch (error) {
        console.error("Could not delete schedule event:", error);
        throw error;
      }
      return;
    }
    saveHidden([...hiddenIds, event.id]);
  }

  async function saveEdit(event: ClassEvent): Promise<void> {
    const saved = added.find((item) => item.id === event.id);
    if (saved) {
      await updateScheduleEvent(event.id, {
        title: event.title,
        category: event.category,
        building: event.building,
        room: event.room,
        date: saved.date,
        start: event.start,
        end: event.end,
      });
      setAdded((previous) => previous.map((item) => (item.id === event.id ? { ...item, ...event } : item)));
      return;
    }
    saveEdits({ ...edits, [event.id]: event });
  }

  return {
    events,
    added,
    setAdded,
    hiddenIds,
    saveHidden,
    edits,
    saveEdits,
    hiddenCount: mockDay.events.filter((event) => hiddenIds.includes(event.id)).length,
    loaded,
    deleteEvent,
    saveEdit,
  };
}
