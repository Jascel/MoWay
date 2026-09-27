"use client";

import { useState } from "react";

import BuildingCombobox from "@/components/BuildingCombobox";
import type { CampusBuilding } from "@/lib/maps/types";

type RouteControlsProps = {
  readonly buildings: readonly CampusBuilding[];
  readonly originId: string;
  readonly destinationId: string;
  readonly isLoading: boolean;
  readonly isRetry: boolean;
  readonly onOriginChange: (buildingId: string) => void;
  readonly onDestinationChange: (buildingId: string) => void;
  readonly onSubmit: () => void;
};

const INPUT_CLASSES =
  "min-h-12 w-full rounded-2xl border border-ink/15 bg-cream px-3 py-2.5 text-base text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-aqua disabled:cursor-not-allowed disabled:opacity-60";

export function RouteControls({
  buildings,
  originId,
  destinationId,
  isLoading,
  isRetry,
  onOriginChange,
  onDestinationChange,
  onSubmit,
}: RouteControlsProps) {
  const sameBuilding = originId === destinationId;
  const nameOf = (id: string) => buildings.find((b) => b.id === id)?.name ?? "";
  // What's typed in each box while searching; it snaps back to the chosen building when you leave.
  const [originText, setOriginText] = useState(nameOf(originId));
  const [destinationText, setDestinationText] = useState(nameOf(destinationId));

  return (
    <form
      className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="block text-sm font-bold text-ink">
          <label htmlFor="route-from">From</label>
          <div className="mt-2">
            <BuildingCombobox
              id="route-from"
              value={originText}
              onChange={setOriginText}
              onPick={(building) => {
                setOriginText(building.name);
                onOriginChange(building.id);
              }}
              onBlur={() => setOriginText(nameOf(originId))}
              placeholder="Search a building"
              className={INPUT_CLASSES}
            />
          </div>
        </div>

        <div className="block text-sm font-bold text-ink">
          <label htmlFor="route-to">To</label>
          <div className="mt-2">
            <BuildingCombobox
              id="route-to"
              value={destinationText}
              onChange={setDestinationText}
              onPick={(building) => {
                setDestinationText(building.name);
                onDestinationChange(building.id);
              }}
              onBlur={() => setDestinationText(nameOf(destinationId))}
              placeholder="Search a building"
              className={INPUT_CLASSES}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={sameBuilding || isLoading}
        className="mt-5 min-h-12 w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aqua disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        {isLoading
          ? "Finding walking route…"
          : isRetry
            ? "Try route again"
            : "Get walking route"}
      </button>

      {sameBuilding ? (
        <p className="mt-3 text-sm leading-6 text-ink/70" role="status">
          Choose two different buildings to get a walking route.
        </p>
      ) : null}
    </form>
  );
}
