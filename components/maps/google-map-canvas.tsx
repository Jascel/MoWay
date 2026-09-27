"use client";

import { useEffect, useRef, useState } from "react";

import { loadMapLibraries } from "@/lib/maps/google-maps";
import type { CampusBuilding } from "@/lib/maps/types";
import type { WalkingRouteState } from "@/components/maps/use-walking-route";
import type { Report } from "@/data/mock";
import { pinColor } from "@/lib/maps/report-pins";
import { categoryInfo, impactOptions } from "@/lib/reportCategories";

type GoogleMapCanvasProps = {
  readonly apiKey: string;
  readonly mapId: string;
  readonly buildings: readonly CampusBuilding[];
  readonly featuredIds: readonly string[]; // buildings that always get a pin; the rest show only when picked as From or To
  readonly originId: string;
  readonly destinationId: string;
  readonly routeState: WalkingRouteState;
  readonly reports?: readonly Report[]; // live community reports, drawn as colored pins
  readonly reportsReady?: boolean; // false until the first list of reports has loaded
};

type MapRuntime = {
  readonly map: google.maps.Map;
  readonly LatLngBounds: typeof google.maps.LatLngBounds;
  readonly Polyline: typeof google.maps.Polyline;
  readonly TrafficLayer: typeof google.maps.TrafficLayer;
  readonly AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  readonly PinElement: typeof google.maps.marker.PinElement;
  readonly InfoWindow: typeof google.maps.InfoWindow;
};

type ReportPin = {
  readonly marker: google.maps.marker.AdvancedMarkerElement;
  report: Report;
};

// The small card that opens when you tap a report pin. Built with textContent, never HTML,
// because the place name and note are typed by users.
function buildReportInfo(report: Report): HTMLElement {
  const line = (text: string, style: string) => {
    const element = document.createElement("div");
    element.textContent = text;
    element.style.cssText = style;
    return element;
  };
  const impact = impactOptions.find((i) => i.value === report.impact)?.label;
  const ago = report.minutesAgo === 0 ? "just now" : `${report.minutesAgo} min ago`;

  const card = document.createElement("div");
  card.style.cssText = "max-width:220px;color:#1f2a44;line-height:1.35";
  card.append(line(categoryInfo(report.category).label, "font-weight:700;font-size:15px"));
  card.append(line(report.location, "font-size:13px;margin-top:2px"));
  if (impact) card.append(line(impact, "font-size:12px;margin-top:4px;font-weight:600"));
  if (report.note) card.append(line(report.note, "font-size:12px;margin-top:4px;opacity:0.8"));
  card.append(
    line(`${report.confirmations} confirmed · ${ago}`, "font-size:11px;margin-top:6px;opacity:0.65")
  );
  return card;
}

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
    record.pin.background = "#006747";
    record.pin.borderColor = "#004d35";
    record.pin.glyphColor = "#ffffff";
    return;
  }

  if (record.buildingId === destinationId) {
    record.pin.glyphText = "B";
    record.pin.background = "#fce38a";
    record.pin.borderColor = "#1f2a44";
    record.pin.glyphColor = "#1f2a44";
    return;
  }

  // A short building code (like "CIS") in small type so three letters fit inside the pin.
  const label = document.createElement("span");
  label.textContent = record.defaultGlyph;
  label.style.cssText = "font-size:9px;font-weight:800;letter-spacing:-0.4px;color:#006747";
  record.pin.glyph = label;
  record.pin.background = "#ffffff";
  record.pin.borderColor = "#006747";
  record.pin.glyphColor = "#006747";
}

export function GoogleMapCanvas({
  apiKey,
  mapId,
  buildings,
  featuredIds,
  originId,
  destinationId,
  routeState,
  reports = [],
  reportsReady = false,
}: GoogleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const markerRecords =
    useRef<readonly MarkerRecord[]>([]);

  const featuredRef = useRef(featuredIds);

  const selectedIds = useRef({
    originId,
    destinationId,
  });

  const [runtime, setRuntime] =
    useState<MapRuntime | null>(null);

  const [trafficEnabled, setTrafficEnabled] =
    useState(false);

  const [loadState, setLoadState] =
    useState<"loading" | "ready" | "error">(
      "loading",
    );

  // Keep selected marker IDs current.
  useEffect(() => {
    selectedIds.current = {
      originId,
      destinationId,
    };
  }, [destinationId, originId]);

  // --------------------
  // INITIALIZE MAP
  // --------------------

  useEffect(() => {
    let isActive = true;
    let didAuthFail = false;

    const previousAuthFailure =
      window.gm_authFailure;

    const handleAuthFailure = (): void => {
      didAuthFail = true;

      if (isActive) {
        setLoadState("error");
      }
    };

    window.gm_authFailure =
      handleAuthFailure;

    async function initializeMap(): Promise<void> {
      const container =
        containerRef.current;

      if (container === null) {
        return;
      }

      try {
        const {
          core,
          maps,
          marker,
        } = await loadMapLibraries(apiKey);

        if (!isActive || didAuthFail) {
          return;
        }

        const map = new maps.Map(
          container,
          {
            center:
              buildings[0]?.position,
            zoom: 16,
            mapId,
            clickableIcons: false,
            fullscreenControl: true,
            mapTypeControl: false,
            streetViewControl: false,
          },
        );

        const bounds =
          new core.LatLngBounds();

        // One shared card that shows a building's name when its pin is tapped.
        const buildingCard = new maps.InfoWindow();

        const records = buildings.map(
          (building) => {
            const shownAtStart =
              featuredRef.current.includes(building.id) ||
              building.id === selectedIds.current.originId ||
              building.id === selectedIds.current.destinationId;

            if (shownAtStart) {
              bounds.extend(
                building.position,
              );
            }

            const pin =
              new marker.PinElement({
                scale: 1.15,
              });

            const record: MarkerRecord = {
              buildingId: building.id,
              defaultGlyph: building.code,
              pin,
              marker:
                new marker.AdvancedMarkerElement(
                  {
                    map: shownAtStart ? map : null,
                    position:
                      building.position,
                    title: building.name,
                    content: pin,
                  },
                ),
            };

            stylePin(
              record,
              selectedIds.current
                .originId,
              selectedIds.current
                .destinationId,
            );

            record.marker.addListener("click", () => {
              const card = document.createElement("div");
              card.textContent = building.name;
              card.style.cssText =
                "font-weight:700;font-size:14px;color:#1f2a44;max-width:200px";
              buildingCard.setContent(card);
              buildingCard.open({ map, anchor: record.marker });
            });

            return record;
          },
        );

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 52);
        }

        markerRecords.current =
          records;

        setRuntime({
          map,
          LatLngBounds:
            core.LatLngBounds,
          Polyline: maps.Polyline,
          TrafficLayer:
            maps.TrafficLayer,
          AdvancedMarkerElement:
            marker.AdvancedMarkerElement,
          PinElement: marker.PinElement,
          InfoWindow: maps.InfoWindow,
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

      markerRecords.current.forEach(
        ({ marker }) => {
          marker.map = null;
        },
      );

      markerRecords.current = [];

      if (
        window.gm_authFailure ===
        handleAuthFailure
      ) {
        window.gm_authFailure =
          previousAuthFailure;
      }
    };
  }, [apiKey, buildings, mapId]);

  // --------------------
  // UPDATE MARKERS
  // --------------------

  // When your schedule changes, frame the buildings on it.
  useEffect(() => {
    featuredRef.current = featuredIds;

    if (runtime === null || featuredIds.length === 0) {
      return;
    }

    const bounds = new runtime.LatLngBounds();

    buildings.forEach((building) => {
      if (featuredIds.includes(building.id)) {
        bounds.extend(building.position);
      }
    });

    if (!bounds.isEmpty()) {
      runtime.map.fitBounds(bounds, 52);

      if ((runtime.map.getZoom() ?? 0) > 17) {
        runtime.map.setZoom(17);
      }
    }
  }, [buildings, featuredIds, runtime]);

  useEffect(() => {
    markerRecords.current.forEach(
      (record) => {
        stylePin(
          record,
          originId,
          destinationId,
        );

        // Buildings that aren't always shown get a pin only while picked as From or To.
        if (runtime !== null) {
          const show =
            featuredIds.includes(record.buildingId) ||
            record.buildingId === originId ||
            record.buildingId === destinationId;

          record.marker.map = show ? runtime.map : null;
        }
      },
    );

    // Bring a newly picked building into view if it's off the screen.
    if (runtime !== null) {
      const view = runtime.map.getBounds();

      [originId, destinationId].forEach((id) => {
        const building = buildings.find((b) => b.id === id);

        if (building && view && !view.contains(building.position)) {
          runtime.map.panTo(building.position);
        }
      });
    }
  }, [buildings, destinationId, featuredIds, originId, runtime]);

  // --------------------
  // DRAW WALKING ROUTE
  // --------------------

  useEffect(() => {
    if (
      runtime === null ||
      routeState.kind !== "success"
    ) {
      return;
    }

    const line =
      new runtime.Polyline({
        map: runtime.map,
        path: [
          ...routeState.route.path,
        ],
        geodesic: true,
        strokeColor: "#006747",
        strokeOpacity: 0.92,
        strokeWeight: 6,
      });

    const bounds =
      new runtime.LatLngBounds();

    routeState.route.path.forEach(
      (position) =>
        bounds.extend(position),
    );

    runtime.map.fitBounds(
      bounds,
      52,
    );

    return () => {
      line.setMap(null);
    };
  }, [routeState, runtime]);

  // --------------------
  // TRAFFIC LAYER
  // --------------------

  useEffect(() => {
    if (
      runtime === null ||
      !trafficEnabled
    ) {
      return;
    }

    const trafficLayer =
      new runtime.TrafficLayer();

    trafficLayer.setMap(
      runtime.map,
    );

    return () => {
      trafficLayer.setMap(null);
    };
  }, [runtime, trafficEnabled]);

  // --------------------
  // LIVE REPORT PINS
  // --------------------

  const reportPins = useRef(new Map<string, ReportPin>());
  const reportsSeen = useRef(false);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (runtime === null || !reportsReady) {
      return;
    }

    const pins = reportPins.current;
    if (infoWindow.current === null) {
      infoWindow.current = new runtime.InfoWindow();
    }
    const info = infoWindow.current;
    const liveIds = new Set(reports.map((report) => report.id));

    // Take down pins for reports that were resolved or expired.
    pins.forEach((pin, id) => {
      if (!liveIds.has(id)) {
        pin.marker.map = null;
        pins.delete(id);
      }
    });

    reports.forEach((report) => {
      const existing = pins.get(report.id);
      if (existing) {
        existing.report = report; // keep the details fresh (like the confirmed count)
        if (existing.marker.map !== runtime.map) {
          existing.marker.map = runtime.map;
        }
        return;
      }

      // The first list of reports is the starting picture. Only reports that arrive AFTER it
      // drop in with an animation and open their card, which is the live moment.
      const arrivedLive = reportsSeen.current;
      const position = { lat: report.latitude, lng: report.longitude };
      const pin = new runtime.PinElement({
        background: pinColor(report.category),
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        glyphText: "!",
        scale: 1.2,
      });
      if (arrivedLive) {
        pin.element.classList.add("animate-pin-drop");
      }

      const marker = new runtime.AdvancedMarkerElement({
        map: runtime.map,
        position,
        title: categoryInfo(report.category).label,
        content: pin.element,
        zIndex: 10,
      });
      const entry: ReportPin = { marker, report };
      pins.set(report.id, entry);

      const openCard = () => {
        info.setContent(buildReportInfo(entry.report));
        info.open({ map: runtime.map, anchor: marker });
      };
      marker.addListener("click", openCard);

      if (arrivedLive) {
        runtime.map.panTo(position);
        openCard();
      }
    });

    reportsSeen.current = true;
  }, [reports, reportsReady, runtime]);

  // Remove every report pin when the map goes away.
  useEffect(() => {
    const pins = reportPins.current;
    return () => {
      pins.forEach((pin) => {
        pin.marker.map = null;
      });
      pins.clear();
    };
  }, []);

  return (
    <div className="relative min-h-[28rem] overflow-hidden rounded-3xl border border-usf-green bg-mint-soft lg:min-h-[38rem]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label="USF Tampa campus map"
      />

      {/* TRAFFIC TOGGLE */}
      {loadState === "ready" && (
        <button
          type="button"
          onClick={() =>
            setTrafficEnabled(
              (current) => !current,
            )
          }
          className="absolute left-4 top-4 z-10 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-md"
          aria-pressed={trafficEnabled}
        >
          {trafficEnabled
            ? "Traffic: On"
            : "Traffic: Off"}
        </button>
      )}

      {/* LOADING */}
      {loadState === "loading" ? (
        <div
          className="absolute inset-0 grid place-items-center bg-cream px-6 text-center text-sm font-medium text-ink/70"
          role="status"
        >
          Loading the USF Tampa map...
        </div>
      ) : null}

      {/* ERROR */}
      {loadState === "error" ? (
        <div
          className="absolute inset-0 grid place-items-center bg-cream px-6 text-center"
          role="alert"
        >
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-base font-bold text-ink">
              Map unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-ink/70">
              {MAP_ERROR_MESSAGE}
            </p>

            <button
              type="button"
              className="mt-5 min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aqua"
              onClick={() =>
                window.location.reload()
              }
            >
              Reload map
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}