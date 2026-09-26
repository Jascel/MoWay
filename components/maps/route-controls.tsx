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
  "mt-2 min-h-12 w-full rounded-xl border border-[#b9cfbd] bg-white px-3 py-2.5 text-base text-[#173b2b] shadow-sm outline-none transition focus:border-[#28613d] focus:ring-4 focus:ring-[#dcebdd] disabled:cursor-not-allowed disabled:bg-[#edf3ed]";

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
      className="rounded-3xl border border-[#c9ddcc] bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <label className="block text-sm font-semibold text-[#244b35]">
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

        <label className="block text-sm font-semibold text-[#244b35]">
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
        className="mt-5 min-h-12 w-full rounded-xl bg-[#28613d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f5032] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a8cdb0] disabled:cursor-not-allowed disabled:bg-[#9bb5a1]"
      >
        {isLoading
          ? "Finding walking route…"
          : isRetry
            ? "Try route again"
            : "Get walking route"}
      </button>

      {sameBuilding ? (
        <p className="mt-3 text-sm leading-6 text-[#765b25]" role="status">
          Choose two different buildings to get a walking route.
        </p>
      ) : null}
    </form>
  );
}
