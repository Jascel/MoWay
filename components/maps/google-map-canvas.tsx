"use client";

import { useEffect, useRef, useState } from "react";

import { loadMapLibraries } from "@/lib/maps/google-maps";
import type { CampusBuilding } from "@/lib/maps/types";
import type { WalkingRouteState } from "@/components/maps/use-walking-route";

type GoogleMapCanvasProps = {
  readonly apiKey: string;
  readonly mapId: string;
  readonly buildings: readonly CampusBuilding[];
  readonly originId: string;
  readonly destinationId: string;
  readonly routeState: WalkingRouteState;
};

type MapRuntime = {
  readonly map: google.maps.Map;
  readonly LatLngBounds: typeof google.maps.LatLngBounds;
  readonly Polyline: typeof google.maps.Polyline;
};

type MarkerRecord = {
  readonly buildingId: string;
  readonly defaultGlyph: string;
  readonly marker: google.maps.marker.AdvancedMarkerElement;
  readonly pin: google.maps.marker.PinElement;
};

const MAP_ERROR_MESSAGE =
  "The campus map could not be loaded. Check the Maps JavaScript API, key restrictions, billing, and your connection.";

function stylePin(
  record: MarkerRecord,
  originId: string,
  destinationId: string,
): void {
  if (record.buildingId === originId) {
    record.pin.glyphText = "A";
    record.pin.background = "#28613d";
    record.pin.borderColor = "#173b2b";
    record.pin.glyphColor = "#ffffff";
    return;
  }

  if (record.buildingId === destinationId) {
    record.pin.glyphText = "B";
    record.pin.background = "#f2c94c";
    record.pin.borderColor = "#765b25";
    record.pin.glyphColor = "#173b2b";
    return;
  }

  record.pin.glyphText = record.defaultGlyph;
  record.pin.background = "#ffffff";
  record.pin.borderColor = "#28613d";
  record.pin.glyphColor = "#28613d";
}

export function GoogleMapCanvas({
  apiKey,
  mapId,
  buildings,
  originId,
  destinationId,
  routeState,
}: GoogleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRecords = useRef<readonly MarkerRecord[]>([]);
  const selectedIds = useRef({ originId, destinationId });
  const [runtime, setRuntime] = useState<MapRuntime | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    selectedIds.current = { originId, destinationId };
  }, [destinationId, originId]);

  useEffect(() => {
    let isActive = true;
    let didAuthFail = false;
    const previousAuthFailure = window.gm_authFailure;
    const handleAuthFailure = (): void => {
      didAuthFail = true;
      if (isActive) {
        setLoadState("error");
      }
    };
    window.gm_authFailure = handleAuthFailure;

    async function initializeMap(): Promise<void> {
      const container = containerRef.current;
      if (container === null) {
        return;
      }

      try {
        const { core, maps, marker } = await loadMapLibraries(apiKey);
        if (!isActive || didAuthFail) {
          return;
        }

        const map = new maps.Map(container, {
          center: buildings[0]?.position,
          zoom: 16,
          mapId,
          clickableIcons: false,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const bounds = new core.LatLngBounds();
        const records = buildings.map((building, index) => {
          bounds.extend(building.position);
          const pin = new marker.PinElement({ scale: 1.05 });
          const record: MarkerRecord = {
            buildingId: building.id,
            defaultGlyph: String(index + 1),
            pin,
            marker: new marker.AdvancedMarkerElement({
              map,
              position: building.position,
              title: building.name,
              content: pin,
            }),
          };
          stylePin(
            record,
            selectedIds.current.originId,
            selectedIds.current.destinationId,
          );
          return record;
        });

        map.fitBounds(bounds, 52);
        markerRecords.current = records;
        setRuntime({
          map,
          LatLngBounds: core.LatLngBounds,
          Polyline: maps.Polyline,
        });
        setLoadState("ready");
      } catch {
        if (!isActive) {
          return;
        }
        setLoadState("error");
      }
    }

    void initializeMap();

    return () => {
      isActive = false;
      markerRecords.current.forEach(({ marker }) => {
        marker.map = null;
      });
      markerRecords.current = [];
      if (window.gm_authFailure === handleAuthFailure) {
        window.gm_authFailure = previousAuthFailure;
      }
    };
  }, [apiKey, buildings, mapId]);

  useEffect(() => {
    markerRecords.current.forEach((record) => {
      stylePin(record, originId, destinationId);
    });
  }, [destinationId, originId]);

  useEffect(() => {
    if (runtime === null || routeState.kind !== "success") {
      return;
    }

    const line = new runtime.Polyline({
      map: runtime.map,
      path: [...routeState.route.path],
      geodesic: true,
      strokeColor: "#28613d",
      strokeOpacity: 0.92,
      strokeWeight: 6,
    });
    const bounds = new runtime.LatLngBounds();
    routeState.route.path.forEach((position) => bounds.extend(position));
    runtime.map.fitBounds(bounds, 52);

    return () => {
      line.setMap(null);
    };
  }, [routeState, runtime]);

  return (
    <div className="relative min-h-[28rem] overflow-hidden rounded-3xl border border-[#c9ddcc] bg-[#dcebdd] shadow-sm lg:min-h-[38rem]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label="USF Tampa campus map"
      />
      {loadState === "loading" ? (
        <div
          className="absolute inset-0 grid place-items-center bg-[#edf3ed] px-6 text-center text-sm font-medium text-[#4d795c]"
          role="status"
        >
          Loading the USF Tampa map…
        </div>
      ) : null}
      {loadState === "error" ? (
        <div
          className="absolute inset-0 grid place-items-center bg-[#edf3ed] px-6 text-center"
          role="alert"
        >
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-[#173b2b]">
              Map unavailable
            </p>
            <p className="mt-2 text-sm leading-6 text-[#59705f]">
              {MAP_ERROR_MESSAGE}
            </p>
            <button
              type="button"
              className="mt-5 min-h-11 rounded-xl bg-[#28613d] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a8cdb0]"
              onClick={() => window.location.reload()}
            >
              Reload map
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
