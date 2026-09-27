"use client";

import { useEffect, useMemo, useState } from "react";

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
import { loadGeocodingLibrary } from "@/lib/maps/google-maps";
import { MAP_ROUTE_KEY, restoreMapSelection, type MapSelection } from "@/lib/maps/map-persistence";
import { chooseRoute } from "@/lib/maps/route-hazards";
import type { CampusBuilding, CampusGarage, CampusPlace } from "@/lib/maps/types";
import { campusMode, profileUsesDriving } from "@/lib/profileMode";
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
  const [savedSelection, saveSelection, selectionLoaded] = useStoredState<MapSelection>(
    MAP_ROUTE_KEY,
    { originId: "", destinationId: "" },
  );
  const schedule = useDaySchedule(mockDay.date);
  const driving = profileUsesDriving(profile);
  const mode = campusMode(profile);
  const [homeStart, setHomeStart] = useState<{
    readonly address: string;
    readonly place: CampusGarage | null;
  }>({ address: "", place: null });

  useEffect(() => {
    if (!profileLoaded) return;
    const address = profile.homeAddress?.trim() ?? "";
    if (driving || address.length === 0 || apiKey.length === 0) return;

    let active = true;
    void loadGeocodingLibrary(apiKey)
      .then((geocoding) => new geocoding.Geocoder().geocode({ address, region: "us" }))
      .then((response) => {
        if (!active) return;
        const result = response.results[0];
        if (!result) {
          setHomeStart({ address, place: null });
          return;
        }
        setHomeStart({
          address,
          place: {
            id: "home-start",
            name: "Starting location",
            position: { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() },
            source: "Google Geocoder",
          },
        });
      })
      .catch(() => {
        if (active) setHomeStart({ address, place: null });
      });
    return () => { active = false; };
  }, [apiKey, driving, profile.homeAddress, profileLoaded]);

  const currentAddress = profile.homeAddress?.trim() ?? "";
  const homePending = !driving && currentAddress.length > 0 && apiKey.length > 0
    && homeStart.address !== currentAddress;
  const homePlace = !driving && currentAddress.length > 0 && apiKey.length > 0
    && homeStart.address === currentAddress ? homeStart.place : null;
  const garages = useMemo(
    () => driving ? CAMPUS_GARAGES : homePlace ? [homePlace] : [],
    [driving, homePlace],
  );
  const places = useMemo<readonly CampusPlace[]>(() => [...garages, ...buildings], [buildings, garages]);
  if (buildings.length === 0) throw new CampusMapDataError();
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
  const defaultOriginId = driving
    ? smartPark.winner?.garage.id ?? CAMPUS_GARAGES[0]?.id ?? ""
    : homePlace?.id ?? "";
  const defaultDestinationId = firstClass?.id ?? buildings[0]?.id ?? "";
  const selectionReady = profileLoaded && selectionLoaded && schedule.loaded && !homePending;
  const selection = selectionReady
    ? restoreMapSelection(
      savedSelection,
      places.map((place) => place.id),
      buildings.map((building) => building.id),
      defaultOriginId,
      defaultDestinationId,
    )
    : { originId: "", destinationId: "" };
  const originId = selection.originId;
  const destinationId = selection.destinationId;

  const fallbackPlace = places[0] ?? buildings[0];
  if (!fallbackPlace) throw new CampusMapDataError();
  const getPlace = (id: string): CampusPlace => places.find((place) => place.id === id) ?? fallbackPlace;
  const origin = getPlace(originId);
  const destination = getPlace(destinationId);
  const {
    state: routeState,
    requestRoute,
    resetRoute,
  } = useWalkingRoute(apiKey, origin, destination);

  useEffect(() => {
    if (!selectionReady || !places.some((place) => place.id === originId)
      || originId === "" || destinationId === "" || originId === destinationId) return;
    void requestRoute();
  }, [destinationId, originId, places, requestRoute, selectionReady]);

  const { reports: reportRows, loading: reportsLoading } = useActiveReports();
  const reports = useMemo(
    () => reportRows.filter((row) => isNearCampus(row.latitude, row.longitude)).map(rowToReport),
    [reportRows],
  );
  const activeRouteState = useMemo(() => routeState.kind === "success"
    && selectionReady
    && places.some((place) => place.id === originId)
    && buildings.some((building) => building.id === destinationId)
    && routeState.candidates.every((candidate) => candidate.originId === originId
      && candidate.destinationId === destinationId)
    ? routeState
    : routeState.kind === "success" ? { kind: "idle" as const } : routeState,
  [buildings, destinationId, originId, places, routeState, selectionReady]);
  const choice = useMemo(
    () => activeRouteState.kind === "success"
      ? chooseRoute(activeRouteState.candidates, reports, mode)
      : null,
    [activeRouteState, mode, reports],
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
      {originId !== "" ? <RouteControls
        key={`${originId}|${destinationId}`}
        buildings={buildings}
        garages={garages}
        originId={originId}
        destinationId={destinationId}
        isLoading={activeRouteState.kind === "loading"}
        isRetry={activeRouteState.kind === "error"}
        onOriginChange={(placeId) => {
          resetRoute();
          saveSelection({ originId: placeId, destinationId });
        }}
        onDestinationChange={(placeId) => {
          resetRoute();
          saveSelection({ originId, destinationId: placeId });
        }}
        onSubmit={() => void requestRoute()}
      /> : <p className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm leading-6 text-ink/70" role="status">
        {driving
          ? "Choose a route after your campus map loads."
          : currentAddress.length === 0
            ? "Add a starting address in Profile to get a route."
            : homePending
              ? "Finding your starting location…"
              : "Your starting address could not be found. Update it in Profile to get a route."}
      </p>}

      <GoogleMapCanvas
        apiKey={apiKey}
        mapId={mapId}
        buildings={buildings}
        garages={garages}
        featuredIds={featuredIds}
        originId={originId}
        destinationId={destinationId}
        routeState={activeRouteState}
        reports={reports}
        reportsReady={!reportsLoading}
        choice={choice}
      />

      <div aria-live="polite" aria-atomic="true">
        {activeRouteState.kind === "loading" ? (
          <p className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70 shadow-sm">
            Finding routes…
          </p>
        ) : null}
        {activeRouteState.kind === "error" ? (
          <p className="rounded-2xl border border-coral bg-white px-4 py-3 text-sm leading-6 text-ink shadow-sm" role="alert">
            {activeRouteState.message}
          </p>
        ) : null}
        {activeRouteState.kind === "success" && choice?.chosen ? (
          <RoutePanel choice={choice} places={places} mode={mode} />
        ) : null}
      </div>

      <ReportLegend count={reports.length} />
    </div>
  );
}
