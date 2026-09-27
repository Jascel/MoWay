"use client";

import BuildingCombobox from "@/components/BuildingCombobox";
import type { CampusBuilding } from "@/lib/maps/types";
import { useState } from "react";
import ChipGroup from "@/components/ChipGroup";
import { categoryStyles } from "@/lib/categories";
import type { ClassEvent, EventCategory } from "@/data/mock";

const categoryOptions = (Object.keys(categoryStyles) as EventCategory[]).map((c) => ({
  value: c,
  label: categoryStyles[c].label,
  icon: categoryStyles[c].icon,
}));

const inputClass = "w-full rounded-2xl border border-ink/15 bg-cream p-3";

// A sheet that slides up over the screen to change one event. It edits a copy,
// and only calls onSave when you press "Save changes".
export default function EventEditor({
  event,
  onSave,
  onClose,
}: {
  event: ClassEvent;
  onSave: (updated: ClassEvent) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<EventCategory>(event.category);
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start);
  const [end, setEnd] = useState(event.end);
  const [building, setBuilding] = useState(event.building);
  const [room, setRoom] = useState(event.room ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start || !end || !building.trim()) {
      setError("Please fill in the name, times, and building.");
      return;
    }
    if (end <= start) {
      setError("The end time has to be after the start time.");
      return;
    }
    onSave({
      ...event,
      category,
      title: title.trim(),
      start,
      end,
      building: building.trim(),
      room: room.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 pb-8"
      >
        <h2 className="font-display text-2xl font-bold">Edit event</h2>

        <div>
          <p className="mb-2 text-sm font-bold">Type</p>
          <ChipGroup options={categoryOptions} selected={[category]} onToggle={(v) => setCategory(v as EventCategory)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold" htmlFor="edit-title">Name</label>
          <input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-sm font-bold" htmlFor="edit-start">Start</label>
            <input id="edit-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputClass} time-input`} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-sm font-bold" htmlFor="edit-end">End</label>
            <input id="edit-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inputClass} time-input`} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-[2]">
            <label className="mb-1 block text-sm font-bold" htmlFor="edit-building">Building</label>
            <BuildingCombobox<CampusBuilding> id="edit-building" value={building} onChange={setBuilding}
              onPick={(picked) => setBuilding(picked.code)} className={inputClass} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-bold" htmlFor="edit-room">Room</label>
            <input id="edit-room" value={room} onChange={(e) => setRoom(e.target.value)} className={inputClass} />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="space-y-1">
          <button type="submit" className="w-full rounded-full bg-ink py-3.5 font-semibold text-white active:bg-ink/80">
            Save changes
          </button>
          <button type="button" onClick={onClose} className="w-full py-2 text-sm font-medium text-ink/60">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
