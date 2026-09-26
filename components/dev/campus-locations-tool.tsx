"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { loadGeocodingLibrary, loadMapLibraries } from "@/lib/maps/google-maps";
import type {
  CampusBuilding,
  CampusGarage,
  MapPosition,
} from "@/lib/maps/types";

type Kind = "building" | "garage";

type Candidate = {
  readonly label: string;
  readonly locationType: string;
  readonly types: readonly string[];
  readonly position: MapPosition;
};

type SearchState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "results"; readonly candidates: readonly Candidate[] }
  | { readonly kind: "error"; readonly message: string };

type SaveState =
  | { readonly kind: "idle" }
  | { readonly kind: "saving" }
  | { readonly kind: "saved"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

type CampusLocationsToolProps = {
  readonly apiKey: string;
  readonly mapId: string;
  readonly buildings: readonly CampusBuilding[];
  readonly garages: readonly CampusGarage[];
};

// Search is biased to the USF Tampa campus so "Library" means ours.
const USF_BOUNDS = {
  south: 28.05,
  west: -82.43,
  north: 28.075,
  east: -82.4,
};
const USF_CENTER: MapPosition = { lat: 28.0615, lng: -82.4135 };

const INPUT_CLASSES =
  "mt-1 min-h-11 w-full rounded-2xl border border-ink/15 bg-cream px-3 py-2 text-base text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-aqua disabled:cursor-not-allowed disabled:opacity-60";
const LABEL_CLASSES = "block text-sm font-bold text-ink";
const PRIMARY_BUTTON =
  "min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aqua disabled:cursor-not-allowed disabled:bg-ink/30";
const SECONDARY_BUTTON =
  "min-h-9 rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aqua";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPosition({ lat, lng }: MapPosition): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CampusLocationsTool({
  apiKey,
  mapId,
  buildings,
  garages,
}: CampusLocationsToolProps) {
  const router = useRouter();

  const [kind, setKind] = useState<Kind>("building");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ kind: "idle" });
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [position, setPosition] = useState<MapPosition | null>(null);
  // The id follows the name until the user edits it directly.
  const [customId, setCustomId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [source, setSource] = useState("");
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Initialize the preview map once, with a draggable pin.
  useEffect(() => {
    if (apiKey.length === 0) {
      return;
    }
    let isActive = true;

    async function init(): Promise<void> {
      const container = mapContainerRef.current;
      if (container === null) {
        return;
      }
      try {
        const { maps, marker } = await loadMapLibraries(apiKey);
        if (!isActive) {
          return;
        }
        const map = new maps.Map(container, {
          center: USF_CENTER,
          zoom: 15,
          mapId,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const pin = new marker.PinElement({
          background: "#006747",
          borderColor: "#004d35",
          glyphColor: "#ffffff",
          scale: 1.1,
        });
        const advanced = new marker.AdvancedMarkerElement({
          map,
          content: pin,
          gmpDraggable: true,
          title: "Drag to the accessible entrance",
        });
        advanced.addListener("dragend", () => {
          const dragged = advanced.position;
          if (dragged === null || dragged === undefined) {
            return;
          }
          const lat =
            typeof dragged.lat === "function" ? dragged.lat() : dragged.lat;
          const lng =
            typeof dragged.lng === "function" ? dragged.lng() : dragged.lng;
          setPosition({ lat, lng });
          setSource((current) =>
            current.includes("pin adjusted")
              ? current
              : `${current}${current ? "; " : ""}pin adjusted by hand`,
          );
        });
        // Click the map to drop the pin when a search result is not close enough.
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          const clicked = event.latLng;
          if (clicked === null) {
            return;
          }
          setPosition({ lat: clicked.lat(), lng: clicked.lng() });
          setSource((current) =>
            current.includes("pin adjusted")
              ? current
              : `${current}${current ? "; " : ""}pin adjusted by hand`,
          );
        });
        mapRef.current = map;
        markerRef.current = advanced;
        setMapState("ready");
      } catch {
        if (isActive) {
          setMapState("error");
        }
      }
    }

    void init();

    return () => {
      isActive = false;
      if (markerRef.current !== null) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, [apiKey, mapId]);

  // Keep the pin and the viewport in sync with the chosen position.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map === null || marker === null || mapState !== "ready") {
      return;
    }
    if (position === null) {
      marker.position = null;
      return;
    }
    marker.position = position;
    map.panTo(position);
    if ((map.getZoom() ?? 0) < 17) {
      map.setZoom(18);
    }
  }, [position, mapState]);

  const id = customId ?? slugify(name);

  async function runSearch(): Promise<void> {
    const trimmed = query.trim();
    if (trimmed === "") {
      return;
    }
    setSearch({ kind: "loading" });
    setSelectedIndex(-1);
    setSave({ kind: "idle" });
    try {
      const { Geocoder } = await loadGeocodingLibrary(apiKey);
      const geocoder = new Geocoder();
      const { results } = await geocoder.geocode({
        address: trimmed,
        bounds: USF_BOUNDS,
        region: "us",
      });
      const candidates: Candidate[] = results.map((result) => ({
        label: result.formatted_address,
        locationType: String(result.geometry.location_type),
        types: result.types,
        position: {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        },
      }));
      if (candidates.length === 0) {
        setSearch({
          kind: "error",
          message: "Google found nothing for that. Try adding “USF” or a street.",
        });
        return;
      }
      setSearch({ kind: "results", candidates });
      if (name.trim() === "") {
        setName(trimmed);
      }
      chooseCandidate(candidates, 0, trimmed);
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("ZERO_RESULTS")
          ? "Google found nothing for that. Try adding “USF” or a street."
          : "Geocoding failed. Check the Maps key allows the Geocoding API and this origin.";
      setSearch({ kind: "error", message });
    }
  }

  function chooseCandidate(
    candidates: readonly Candidate[],
    index: number,
    searched: string,
  ): void {
    const candidate = candidates[index];
    if (candidate === undefined) {
      return;
    }
    setSelectedIndex(index);
    setPosition(candidate.position);
    setSource(
      `Google Geocoder (${candidate.locationType}), ${today()}, query "${searched}"`,
    );
  }

  function loadExisting(
    existingKind: Kind,
    entry: CampusBuilding | CampusGarage,
  ): void {
    setKind(existingKind);
    setCustomId(entry.id);
    setName(entry.name);
    setCode("code" in entry ? entry.code : "");
    setAliases("aliases" in entry ? (entry.aliases ?? []).join(", ") : "");
    setPosition(entry.position);
    setSource(entry.source ?? "");
    setQuery(entry.name);
    setSearch({ kind: "idle" });
    setSelectedIndex(-1);
    setSave({ kind: "idle" });
  }

  function resetForm(): void {
    setQuery("");
    setSearch({ kind: "idle" });
    setSelectedIndex(-1);
    setPosition(null);
    setCustomId(null);
    setCode("");
    setName("");
    setAliases("");
    setSource("");
    setSave({ kind: "idle" });
  }

  async function submit(): Promise<void> {
    if (position === null) {
      setSave({ kind: "error", message: "Search and pick a result first." });
      return;
    }
    setSave({ kind: "saving" });
    try {
      const response = await fetch("/api/dev/campus-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          id,
          name,
          code: kind === "building" ? code : undefined,
          aliases:
            kind === "building"
              ? aliases
                  .split(",")
                  .map((alias) => alias.trim())
                  .filter(Boolean)
              : undefined,
          position,
          source,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not save.";
        setSave({ kind: "error", message });
        return;
      }
      const replaced =
        typeof payload === "object" &&
        payload !== null &&
        "replaced" in payload &&
        payload.replaced === true;
      setSave({
        kind: "saved",
        message: `${replaced ? "Updated" : "Added"} ${kind} "${id}" in data/campus-locations.json.`,
      });
      router.refresh();
    } catch {
      setSave({ kind: "error", message: "Could not reach the dev API." });
    }
  }

  if (apiKey.length === 0) {
    return (
      <section className="rounded-3xl bg-sun/40 p-6" role="alert">
        <h2 className="text-lg font-bold text-ink">Google Maps needs local setup</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart the dev
          server. The key must allow the Geocoding API for this origin.
        </p>
      </section>
    );
  }

  const canSave =
    position !== null &&
    id.trim() !== "" &&
    name.trim() !== "" &&
    (kind === "garage" || code.trim() !== "") &&
    save.kind !== "saving";

  return (
    <div className="space-y-5">
      <form
        className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <fieldset className="flex gap-4">
          <legend className={LABEL_CLASSES}>What is it?</legend>
          {(["building", "garage"] as const).map((option) => (
            <label
              key={option}
              className="mt-2 flex items-center gap-2 text-sm text-ink"
            >
              <input
                type="radio"
                name="kind"
                value={option}
                checked={kind === option}
                onChange={() => setKind(option)}
              />
              {option === "building" ? "Building" : "Parking garage"}
            </label>
          ))}
        </fieldset>

        <div>
          <label className={LABEL_CLASSES} htmlFor="campus-search">
            Search Google
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="campus-search"
              className={`${INPUT_CLASSES} mt-0`}
              placeholder="e.g. Beard Parking Garage USF"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch();
                }
              }}
            />
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={search.kind === "loading" || query.trim() === ""}
              onClick={() => void runSearch()}
            >
              {search.kind === "loading" ? "Searching…" : "Search"}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Biased to the USF Tampa campus. Add “USF” or a street name if the
            first try misses.
          </p>
        </div>

        {search.kind === "error" ? (
          <p
            className="rounded-2xl border border-coral bg-white px-4 py-3 text-sm text-ink"
            role="alert"
          >
            {search.message}
          </p>
        ) : null}

        {search.kind === "results" ? (
          <div>
            <label className={LABEL_CLASSES} htmlFor="campus-candidate">
              Pick the correct result ({search.candidates.length})
            </label>
            <select
              id="campus-candidate"
              className={INPUT_CLASSES}
              value={selectedIndex}
              onChange={(event) =>
                chooseCandidate(
                  search.candidates,
                  Number(event.target.value),
                  query.trim(),
                )
              }
            >
              {search.candidates.map((candidate, index) => (
                <option key={`${candidate.label}-${index}`} value={index}>
                  {candidate.label} · {candidate.locationType} ·{" "}
                  {formatPosition(candidate.position)}
                </option>
              ))}
            </select>
            {selectedIndex >= 0 ? (
              <p className="mt-1 text-xs text-ink/60">
                Types: {search.candidates[selectedIndex]?.types.join(", ")}.
                ROOFTOP is a building match; APPROXIMATE or a “route” type
                usually means Google did not find the place.
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className={LABEL_CLASSES}>Confirm on the map</p>
          <p className="mt-1 text-xs text-ink/60">
            Drag the pin (or click the map) to move it to the accessible
            entrance before saving.
          </p>
          <div className="relative mt-2 h-72 overflow-hidden rounded-2xl border border-usf-green bg-mint-soft">
            <div
              ref={mapContainerRef}
              className="absolute inset-0"
              role="region"
              aria-label="Location preview map"
            />
            {mapState === "loading" ? (
              <div
                className="absolute inset-0 grid place-items-center bg-cream text-sm text-ink/70"
                role="status"
              >
                Loading map…
              </div>
            ) : null}
            {mapState === "error" ? (
              <div
                className="absolute inset-0 grid place-items-center bg-cream px-6 text-center text-sm text-ink/70"
                role="alert"
              >
                The preview map could not load. You can still save the
                coordinates from the search result.
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-ink">
            <span className="font-semibold">Position:</span>{" "}
            {position === null ? "none yet" : formatPosition(position)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL_CLASSES}>
            Name
            <input
              className={INPUT_CLASSES}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Beard Garage"
            />
          </label>
          <label className={LABEL_CLASSES}>
            Id
            <input
              className={INPUT_CLASSES}
              value={id}
              onChange={(event) => setCustomId(event.target.value)}
              placeholder="beard"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </label>
          {kind === "building" ? (
            <>
              <label className={LABEL_CLASSES}>
                Schedule code
                <input
                  className={INPUT_CLASSES}
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="CIS"
                />
              </label>
              <label className={LABEL_CLASSES}>
                Aliases (comma-separated)
                <input
                  className={INPUT_CLASSES}
                  value={aliases}
                  onChange={(event) => setAliases(event.target.value)}
                  placeholder="USF Library, Library"
                />
              </label>
            </>
          ) : null}
          <label className={`${LABEL_CLASSES} sm:col-span-2`}>
            Source note
            <input
              className={INPUT_CLASSES}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Google Geocoder (ROOFTOP), 2026-09-26"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={PRIMARY_BUTTON} disabled={!canSave}>
            {save.kind === "saving"
              ? "Saving…"
              : `Save ${kind} to campus-locations.json`}
          </button>
          <button type="button" className={SECONDARY_BUTTON} onClick={resetForm}>
            Clear
          </button>
        </div>

        <div aria-live="polite">
          {save.kind === "saved" ? (
            <p className="rounded-2xl bg-mint px-4 py-3 text-sm text-ink">
              {save.message}
            </p>
          ) : null}
          {save.kind === "error" ? (
            <p
              className="rounded-2xl border border-coral bg-white px-4 py-3 text-sm text-ink"
              role="alert"
            >
              {save.message}
            </p>
          ) : null}
        </div>
      </form>

      <ExistingList
        title="Buildings"
        items={buildings}
        onEdit={(entry) => loadExisting("building", entry)}
      />
      <ExistingList
        title="Parking garages"
        items={garages}
        onEdit={(entry) => loadExisting("garage", entry)}
      />
    </div>
  );
}

type ExistingListProps<T extends CampusBuilding | CampusGarage> = {
  readonly title: string;
  readonly items: readonly T[];
  readonly onEdit: (entry: T) => void;
};

function ExistingList<T extends CampusBuilding | CampusGarage>({
  title,
  items,
  onEdit,
}: ExistingListProps<T>) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-ink">
        {title} ({items.length})
      </h2>
      <ul className="mt-3 divide-y divide-ink/10">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {"code" in item ? `${item.code} · ` : ""}
                {item.name}
              </p>
              <p className="text-xs text-ink/60">
                {item.id} · {formatPosition(item.position)}
                {item.source ? ` · ${item.source}` : ""}
              </p>
            </div>
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={() => onEdit(item)}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
