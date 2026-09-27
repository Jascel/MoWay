"use client";

import { useMemo, useState } from "react";

import RoutePanel from "@/components/RoutePanel";
import { GoogleMapCanvas } from "@/components/maps/google-map-canvas";
import { RouteControls } from "@/components/maps/route-controls";
import { useWalkingRoute } from "@/components/maps/use-walking-route";
import type { CampusBuilding } from "@/lib/maps/types";
import ReportLegend from "@/components/maps/ReportLegend";
import { isNearCampus } from "@/lib/campus";
import { rowToReport } from "@/lib/database/mapReport";
import { useActiveReports } from "@/lib/database/useActiveReports";

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

  // Live community reports, kept up to date by Supabase Realtime. Only ones near campus get a pin.
  const { reports: reportRows, loading: reportsLoading } = useActiveReports();
  const reports = useMemo(
    () => reportRows.filter((row) => isNearCampus(row.latitude, row.longitude)).map(rowToReport),
    [reportRows],
  );

  if (apiKey.length === 0) {
    return (
      <section
        className="rounded-3xl bg-sun/40 p-6"
        role="alert"
      >
        <h2 className="text-lg font-bold text-ink">
          Google Maps needs local setup
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, then restart the
          development server. Keep the real key out of Git.
        </p>
        <button
          type="button"
          className="mt-5 min-h-11 rounded-xl bg-usf-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-usf-green-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint"
          onClick={() => window.location.reload()}
        >
          Retry map
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
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

      <GoogleMapCanvas
        apiKey={apiKey}
        mapId={mapId}
        buildings={buildings}
        originId={originId}
        destinationId={destinationId}
        routeState={routeState}
        reports={reports}
        reportsReady={!reportsLoading}
      />

      <ReportLegend count={reports.length} />

      <div aria-live="polite" aria-atomic="true">
        {routeState.kind === "loading" ? (
          <p className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70 shadow-sm">
            Asking Google for a walking route…
          </p>
        ) : null}
        {routeState.kind === "error" ? (
          <p
            className="rounded-2xl border border-coral bg-white px-4 py-3 text-sm leading-6 text-ink shadow-sm"
            role="alert"
          >
            {routeState.message}
          </p>
        ) : null}
        {routeState.kind === "success" ? (
          <RoutePanel route={routeState.route} buildings={buildings} />
        ) : null}
      </div>
    </div>
  );
}
