"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import RoutePanel from "@/components/RoutePanel";
import { GoogleMapCanvas } from "@/components/maps/google-map-canvas";
import { RouteControls } from "@/components/maps/route-controls";
import ReportLegend from "@/components/maps/ReportLegend";
import { useWalkingRoute } from "@/components/maps/use-walking-route";
import { mockDay, mockProfile, type Profile } from "@/data/mock";
import { isNearCampus } from "@/lib/campus";
import { findBuildingByLabel } from "@/lib/maps/campus-buildings";
import { rowToReport } from "@/lib/database/mapReport";
import { useActiveReports } from "@/lib/database/useActiveReports";
import { PROFILE_KEY } from "@/lib/options";
import { CAMPUS_GARAGES } from "@/lib/maps/campus-parking";
import { chooseRoute } from "@/lib/maps/route-hazards";
import type { CampusBuilding, CampusPlace } from "@/lib/maps/types";
import { campusMode } from "@/lib/profileMode";
import { planSmartPark } from "@/lib/smartPark";
import { useDaySchedule } from "@/lib/useDaySchedule";
import { useStoredState } from "@/lib/useStoredState";

type CampusMapProps = {
  readonly apiKey: string;
  readonly mapId: string;
  readonly buildings: readonly CampusBuilding[];
};

class CampusMapDataError extends Error {
  readonly name = "CampusMapDataError";

  constructor() {
    super("Campus map requires at least two places.");
  }
}

export function CampusMap({ apiKey, mapId, buildings }: CampusMapProps) {
  const [profile, , profileLoaded] = useStoredState<Profile>(PROFILE_KEY, mockProfile);
  const schedule = useDaySchedule(mockDay.date);
  const places = useMemo<readonly CampusPlace[]>(
    () => [...CAMPUS_GARAGES, ...buildings],
    [buildings],
  );

  if (places.length < 2) throw new CampusMapDataError();

  const mode = campusMode(profile);
  const dayBuildings = useMemo(
    () => schedule.events
      .map((event) => findBuildingByLabel(event.building, buildings))
      .filter((building): building is CampusBuilding => building !== undefined),
    [buildings, schedule.events],
  );
  // The map only shows pins for buildings on your schedule, plus whatever you pick as From/To.
  const featuredIds = useMemo(() => dayBuildings.map((building) => building.id), [dayBuildings]);
  const smartPark = useMemo(
    () => planSmartPark(CAMPUS_GARAGES, dayBuildings, mode),
    [dayBuildings, mode],
  );
  const firstClass = dayBuildings[0] ?? buildings[0];
  const defaultOriginId = smartPark.winner?.garage.id ?? CAMPUS_GARAGES[0]?.id ?? places[0].id;
  const defaultDestinationId = firstClass?.id ?? places[1].id;
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const selectionInitialized = useRef(false);

  useEffect(() => {
    if (!profileLoaded || !schedule.loaded || selectionInitialized.current) return;
    setOriginId(defaultOriginId);
    setDestinationId(defaultDestinationId);
    selectionInitialized.current = true;
  }, [defaultDestinationId, defaultOriginId, profileLoaded, schedule.loaded]);

  const getPlace = (id: string): CampusPlace => places.find((place) => place.id === id) ?? places[0];
  const origin = getPlace(originId);
  const destination = getPlace(destinationId);
  const {
    state: routeState,
    requestRoute,
    resetRoute,
  } = useWalkingRoute(apiKey, origin, destination);

  useEffect(() => {
    if (!selectionInitialized.current || originId === "" || destinationId === "" || originId === destinationId) return;
    void requestRoute();
  }, [destinationId, originId, requestRoute]);

  const { reports: reportRows, loading: reportsLoading } = useActiveReports();
  const reports = useMemo(
    () => reportRows.filter((row) => isNearCampus(row.latitude, row.longitude)).map(rowToReport),
    [reportRows],
  );
  const choice = useMemo(
    () => routeState.kind === "success" ? chooseRoute(routeState.candidates, reports, mode) : null,
    [mode, reports, routeState],
  );

  if (apiKey.length === 0) {
    return (
      <section className="rounded-3xl bg-sun/40 p-6" role="alert">
        <h2 className="text-lg font-bold text-ink">Google Maps needs local setup</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, then restart the development server. Keep the real key out of Git.
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
        key={`${originId}|${destinationId}`}
        buildings={buildings}
        garages={CAMPUS_GARAGES}
        originId={originId}
        destinationId={destinationId}
        isLoading={routeState.kind === "loading"}
        isRetry={routeState.kind === "error"}
        onOriginChange={(placeId) => {
          resetRoute();
          setOriginId(placeId);
        }}
        onDestinationChange={(placeId) => {
          resetRoute();
          setDestinationId(placeId);
        }}
        onSubmit={() => void requestRoute()}
      />

      <GoogleMapCanvas
        apiKey={apiKey}
        mapId={mapId}
        buildings={buildings}
        garages={CAMPUS_GARAGES}
        featuredIds={featuredIds}
        originId={originId}
        destinationId={destinationId}
        routeState={routeState}
        reports={reports}
        reportsReady={!reportsLoading}
        choice={choice}
      />

      <ReportLegend count={reports.length} />

      <div aria-live="polite" aria-atomic="true">
        {routeState.kind === "loading" ? (
          <p className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70 shadow-sm">
            Asking Google for walking routes…
          </p>
        ) : null}
        {routeState.kind === "error" ? (
          <p className="rounded-2xl border border-coral bg-white px-4 py-3 text-sm leading-6 text-ink shadow-sm" role="alert">
            {routeState.message}
          </p>
        ) : null}
        {routeState.kind === "success" && choice?.chosen ? (
          <RoutePanel choice={choice} places={places} mode={mode} />
        ) : null}
      </div>
    </div>
  );
}
