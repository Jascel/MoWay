"use client";

import { useId, useState } from "react";
import { MapPin } from "lucide-react";

import { searchBuildings } from "@/lib/maps/campus-buildings";
import type { CampusPlace } from "@/lib/maps/types";

// A text box that suggests USF buildings as you type (by code like "CIS" or any part of
// the name). Picking one calls onPick; typing anything else is still allowed.
export default function BuildingCombobox<T extends CampusPlace>({
  id,
  value,
  onChange,
  onPick,
  onBlur,
  places,
  placeholder,
  className,
}: {
  id?: string;
  value: string;
  onChange: (text: string) => void;
  onPick: (place: T) => void;
  onBlur?: () => void;
  places?: readonly T[];
  placeholder?: string;
  className: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = open ? searchBuildings(value, places) : [];

  function pick(building: T) {
    onPick(building);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className={className}
        onFocus={(e) => {
          e.currentTarget.select();
          setOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onBlur={() => {
          // let a tap on a suggestion land before the list closes
          setTimeout(() => {
            setOpen(false);
            onBlur?.();
          }, 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && matches.length > 0) {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp" && matches.length > 0) {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full min-w-[16rem] overflow-auto rounded-2xl border border-ink/10 bg-white p-1 shadow-lg"
        >
          {matches.map((building, index) => (
            <li
              key={building.id}
              role="option"
              aria-selected={index === active}
              onPointerDown={(e) => {
                e.preventDefault();
                pick(building);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                index === active ? "bg-mint-soft" : ""
              }`}
            >
              <MapPin className="size-4 shrink-0 text-leaf" aria-hidden />
              <span className="min-w-0 flex-1 font-semibold">{building.name}</span>
              <span className="shrink-0 rounded-full bg-aqua-soft px-2 py-0.5 text-xs font-bold">
                {"code" in building && building.code ? building.code : "P"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
