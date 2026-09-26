"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import { categoryStyles } from "@/lib/categories";
import { formatTime } from "@/lib/time";
import { useStoredState } from "@/lib/useStoredState";
import type { EventCategory, SavedEvent } from "@/data/mock";

const categoryOptions = (Object.keys(categoryStyles) as EventCategory[]).map((c) => ({
  value: c,
  label: categoryStyles[c].label,
}));

const inputClass = "w-full rounded-xl border border-gray-300 bg-white p-3";

export default function AddPage() {
  // The saved list lives in localStorage; the form fields live in normal useState.
  const [events, saveEvents] = useStoredState<SavedEvent[]>("moway.events", []);
  const [category, setCategory] = useState<EventCategory>("class");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
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
      <PageHeader title="Add to your day" subtitle="Classes, events, errands" />
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit"
          className="w-full rounded-xl bg-usf-green py-3 font-semibold text-white active:bg-usf-green-dark">
          Add to my schedule
        </button>
      </form>

      {sorted.length > 0 && (
        <section className="space-y-2 p-4 pt-0">
          <h2 className="text-lg font-bold">Added events</h2>
          {sorted.map((ev) => (
            <div key={ev.id}
              className={`flex items-center justify-between rounded-2xl p-3 text-white ${categoryStyles[ev.category].bg}`}>
              <div>
                <p className="font-semibold">{ev.title}</p>
                <p className="text-sm text-white/90">
                  {ev.date}, {formatTime(ev.start)} - {formatTime(ev.end)}, {ev.building}
                  {ev.room && ` ${ev.room}`}
                </p>
              </div>
              <button type="button" aria-label={`Delete ${ev.title}`}
                onClick={() => saveEvents(events.filter((x) => x.id !== ev.id))}
                className="ml-2 text-xl">
                ✕
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
