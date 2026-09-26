"use client";

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

const SELECT_CLASSES =
  "mt-2 min-h-12 w-full rounded-2xl border border-ink/15 bg-cream px-3 py-2.5 text-base text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-aqua disabled:cursor-not-allowed disabled:opacity-60";

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

  return (
    <form
      className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <label className="block text-sm font-bold text-ink">
          From
          <select
            className={SELECT_CLASSES}
            value={originId}
            onChange={(event) => onOriginChange(event.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold text-ink">
          To
          <select
            className={SELECT_CLASSES}
            value={destinationId}
            onChange={(event) => onDestinationChange(event.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </label>
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
