"use client";

import { useState } from "react";

import { GoogleMapCanvas } from "@/components/maps/google-map-canvas";
import { RouteControls } from "@/components/maps/route-controls";
import { RouteSummary } from "@/components/maps/route-summary";
import { useWalkingRoute } from "@/components/maps/use-walking-route";
import type { CampusBuilding } from "@/lib/maps/types";

type CampusMapProps = {
  readonly apiKey: string;
  readonly mapId: string;
  readonly buildings: readonly CampusBuilding[];
};

function getBuilding(
  buildings: readonly CampusBuilding[],
  buildingId: string,
): CampusBuilding {
  if (buildings.length < 2) {
    throw new CampusMapDataError();
  }
  const building = buildings.find(({ id }) => id === buildingId) ?? buildings[0];
  if (building === undefined) {
    throw new CampusMapDataError();
  }
  return building;
}

class CampusMapDataError extends Error {
  readonly name = "CampusMapDataError";

  constructor() {
    super("Campus map requires at least two buildings.");
  }
}

export function CampusMap({ apiKey, mapId, buildings }: CampusMapProps) {
  const [originId, setOriginId] = useState(buildings[0]?.id ?? "");
  const [destinationId, setDestinationId] = useState(buildings[1]?.id ?? "");
  const origin = getBuilding(buildings, originId);
  const destination = getBuilding(buildings, destinationId);
  const {
    state: routeState,
    requestRoute,
    resetRoute,
  } = useWalkingRoute(apiKey, origin, destination);

  if (apiKey.length === 0) {
    return (
      <section
        className="rounded-3xl border border-[#d9c997] bg-[#fffaf0] p-6 shadow-sm"
        role="alert"
      >
        <h2 className="text-lg font-semibold text-[#513f19]">
          Google Maps needs local setup
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#765b25]">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, then restart the
          development server. Keep the real key out of Git.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <aside className="space-y-5">
        <RouteControls
          buildings={buildings}
          originId={originId}
          destinationId={destinationId}
          isLoading={routeState.kind === "loading"}
          isRetry={routeState.kind === "error"}
          onOriginChange={(buildingId) => {
            resetRoute();
            setOriginId(buildingId);
          }}
          onDestinationChange={(buildingId) => {
            resetRoute();
            setDestinationId(buildingId);
          }}
          onSubmit={() => void requestRoute()}
        />

        <div aria-live="polite" aria-atomic="true">
          {routeState.kind === "loading" ? (
            <p className="rounded-2xl border border-[#c9ddcc] bg-[#f7faf6] px-4 py-3 text-sm text-[#4d795c]">
              Asking Google for a walking route…
            </p>
          ) : null}
          {routeState.kind === "error" ? (
            <p
              className="rounded-2xl border border-[#e6c3b8] bg-[#fff7f4] px-4 py-3 text-sm leading-6 text-[#7a3828]"
              role="alert"
            >
              {routeState.message}
            </p>
          ) : null}
          {routeState.kind === "success" ? (
            <RouteSummary
              route={routeState.route}
              origin={origin}
              destination={destination}
            />
          ) : null}
        </div>
      </aside>

      <GoogleMapCanvas
        apiKey={apiKey}
        mapId={mapId}
        buildings={buildings}
        originId={originId}
        destinationId={destinationId}
        routeState={routeState}
      />
    </div>
  );
}
