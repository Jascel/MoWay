"use client";

import { useState } from "react";
import { X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import { categoryStyles } from "@/lib/categories";
import { formatTime } from "@/lib/time";
import { useStoredState } from "@/lib/useStoredState";
import { mockDay, type EventCategory, type SavedEvent } from "@/data/mock";

const categoryOptions = (Object.keys(categoryStyles) as EventCategory[]).map((c) => ({
  value: c,
  label: categoryStyles[c].label,
  icon: categoryStyles[c].icon,
}));

const inputClass = "w-full rounded-2xl border border-ink/15 bg-cream p-3";

export default function AddPage() {
  // The saved list lives in localStorage; the form fields live in normal useState.
  const [events, saveEvents] = useStoredState<SavedEvent[]>("moway.events", []);
  const [category, setCategory] = useState<EventCategory>("class");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(mockDay.date);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // stop the browser from reloading the page
    if (!title.trim() || !date || !start || !end || !building.trim()) {
      setError("Please fill in the name, date, times, and building.");
      return;
    }
    if (end <= start) {
      setError("The end time has to be after the start time.");
      return;
    }
    setError("");
    const newEvent: SavedEvent = {
      id: crypto.randomUUID(),
      category,
      title: title.trim(),
      building: building.trim(),
      room: room.trim() || undefined,
      date,
      start,
      end,
    };
    saveEvents([...events, newEvent]);
    setTitle("");
    setBuilding("");
    setRoom("");
  }

  const sorted = [...events].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  return (
    <>
      <PageHeader title="Add to your day" subtitle="Classes, events, errands" tone="sun" />
      <div className="-mt-6 space-y-6 px-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
        <div>
          <p className="mb-2 text-sm font-bold">Type</p>
          <ChipGroup
            options={categoryOptions}
            selected={[category]}
            onToggle={(v) => setCategory(v as EventCategory)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold" htmlFor="title">Name</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="MAC 2312" className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold" htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className={inputClass} />
          <p className="mt-1 text-xs text-ink/60">
            The Today screen shows {mockDay.date} (your demo Thursday). Events on that date appear there.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-bold" htmlFor="start">Start</label>
            <input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className={inputClass} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-bold" htmlFor="end">End</label>
            <input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)}
              className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-[2]">
            <label className="mb-1 block text-sm font-bold" htmlFor="building">Building</label>
            <input id="building" value={building} onChange={(e) => setBuilding(e.target.value)}
              placeholder="CIS" className={inputClass} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-bold" htmlFor="room">Room</label>
            <input id="room" value={room} onChange={(e) => setRoom(e.target.value)}
              placeholder="1045" className={inputClass} />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button type="submit"
          className="w-full rounded-full bg-ink py-3.5 font-semibold text-white active:bg-ink/80">
          Add to my schedule
        </button>
      </form>

      {sorted.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">Added events</h2>
          {sorted.map((ev) => (
            <div key={ev.id}
              className={`flex items-center justify-between rounded-3xl p-4 ${categoryStyles[ev.category].bg}`}>
              <div>
                <p className="font-semibold">{ev.title}</p>
                <p className="text-sm text-ink/80">
                  {ev.date}, {formatTime(ev.start)} - {formatTime(ev.end)}, {ev.building}
                  {ev.room && ` ${ev.room}`}
                </p>
              </div>
              <button type="button" aria-label={`Delete ${ev.title}`}
                onClick={() => saveEvents(events.filter((x) => x.id !== ev.id))}
                className="ml-2 rounded-full bg-white/60 p-1.5">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
    </>
  );
}
