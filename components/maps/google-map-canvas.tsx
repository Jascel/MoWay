"use client";

import { useEffect, useRef, useState } from "react";

import { loadMapLibraries } from "@/lib/maps/google-maps";
import type { CampusBuilding, CampusGarage } from "@/lib/maps/types";
import type { RouteChoice } from "@/lib/maps/route-hazards";
import type { WalkingRouteState } from "@/components/maps/use-walking-route";
import type { Report } from "@/data/mock";
import { pinColor } from "@/lib/maps/report-pins";
import { categoryInfo, impactOptions } from "@/lib/reportCategories";

type GoogleMapCanvasProps = {
  readonly apiKey: string;
  readonly mapId: string;
  readonly buildings: readonly CampusBuilding[];
  readonly garages?: readonly CampusGarage[];
  readonly originId: string;
  readonly destinationId: string;
  readonly routeState: WalkingRouteState;
  readonly reports?: readonly Report[]; // live community reports, drawn as colored pins
  readonly reportsReady?: boolean; // false until the first list of reports has loaded
  readonly choice?: RouteChoice | null;
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
  readonly pin: google.maps.marker.PinElement;
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
  const status = report.status === "confirmed" ? "Confirmed" : "Needs confirmation";
  card.append(line(`${status} · ${report.confirmations} confirmed · ${ago}`, "font-size:11px;margin-top:6px;opacity:0.65"));
  return card;
}

function styleReportPin(pin: google.maps.marker.PinElement, report: Report): void {
  const confirmed = report.status === "confirmed";
  pin.background = pinColor(report.category);
  pin.borderColor = confirmed ? "#006747" : "#ffffff";
  pin.glyphColor = "#ffffff";
  pin.glyphText = confirmed ? "✓" : "!";
  pin.scale = confirmed ? 1.34 : 1.2;
}

type MarkerRecord = {
  readonly placeId: string;
  readonly defaultGlyph: string;
  readonly isGarage: boolean;
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
  if (record.placeId === originId) {
    record.pin.glyphText = "A";
    record.pin.background = "#006747";
    record.pin.borderColor = "#004d35";
    record.pin.glyphColor = "#ffffff";
    return;
  }

  if (record.placeId === destinationId) {
    record.pin.glyphText = "B";
    record.pin.background = "#fce38a";
    record.pin.borderColor = "#1f2a44";
    record.pin.glyphColor = "#1f2a44";
    return;
  }

  if (record.isGarage) {
    record.pin.glyphText = "P";
    record.pin.background = "#ffffff";
    record.pin.borderColor = "#006747";
    record.pin.glyphColor = "#006747";
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
  garages = [],
  originId,
  destinationId,
  routeState,
  reports = [],
  reportsReady = false,
  choice = null,
}: GoogleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const markerRecords =
    useRef<readonly MarkerRecord[]>([]);

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
            bounds.extend(
              building.position,
            );

            const pin =
              new marker.PinElement({
                scale: 1.15,
              });

            const record: MarkerRecord = {
              placeId: building.id,
              defaultGlyph: building.code,
              isGarage: false,
              pin,
              marker:
                new marker.AdvancedMarkerElement(
                  {
                    map,
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

        const garageRecords = (garages ?? []).map((garage) => {
          bounds.extend(garage.position);
          const pin = new marker.PinElement({ scale: 1.15 });
          const record: MarkerRecord = {
            placeId: garage.id,
            defaultGlyph: "P",
            isGarage: true,
            pin,
            marker: new marker.AdvancedMarkerElement({
              map,
              position: garage.position,
              title: garage.name,
              content: pin,
            }),
          };
          stylePin(record, selectedIds.current.originId, selectedIds.current.destinationId);
          record.marker.addListener("click", () => {
            const card = document.createElement("div");
            card.textContent = garage.name;
            card.style.cssText = "font-weight:700;font-size:14px;color:#1f2a44;max-width:200px";
            buildingCard.setContent(card);
            buildingCard.open({ map, anchor: record.marker });
          });
          return record;
        });

        map.fitBounds(bounds, 52);

        markerRecords.current =
          [...records, ...garageRecords];

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
  }, [apiKey, buildings, garages, mapId]);

  // --------------------
  // UPDATE MARKERS
  // --------------------

  useEffect(() => {
    markerRecords.current.forEach(
      (record) => {
        stylePin(
          record,
          originId,
          destinationId,
        );
      },
    );
  }, [destinationId, originId]);

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

    const chosen = choice?.chosen ?? routeState.route;
    const rejected = choice?.rejected ?? [];
    const rejectedLines = rejected.map((route) => new runtime.Polyline({
      map: runtime.map,
      path: [...route.path],
      geodesic: true,
      strokeColor: "#6b7280",
      strokeOpacity: 0.2,
      strokeWeight: 4,
      icons: [{
        icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, scale: 3 },
        offset: "0",
        repeat: "14px",
      }],
    }));
    const line = new runtime.Polyline({
      map: runtime.map,
      path: [...chosen.path],
      geodesic: true,
      strokeColor: "#006747",
      strokeOpacity: 0.92,
      strokeWeight: 6,
    });

    const bounds =
      new runtime.LatLngBounds();

    chosen.path.forEach(
      (position) =>
        bounds.extend(position),
    );

    runtime.map.fitBounds(
      bounds,
      52,
    );

    return () => {
      line.setMap(null);
      rejectedLines.forEach((rejectedLine) => rejectedLine.setMap(null));
    };
  }, [choice, routeState, runtime]);

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
        existing.report = report;
        styleReportPin(existing.pin, report);
        if (existing.marker.map !== runtime.map) {
          existing.marker.map = runtime.map;
        }
        return;
      }

      // The first list of reports is the starting picture. Only reports that arrive AFTER it
      // drop in with an animation and open their card, which is the live moment.
      const arrivedLive = reportsSeen.current;
      const position = { lat: report.latitude, lng: report.longitude };
      const pin = new runtime.PinElement({ scale: 1.2 });
      styleReportPin(pin, report);
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
      const entry: ReportPin = { marker, pin, report };
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
