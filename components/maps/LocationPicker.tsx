"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { CAMPUS_CENTER, isNearCampus } from "@/lib/campus";
import { findBuildingByLabel } from "@/lib/maps/campus-buildings";
import { DEMO_SPOT } from "@/lib/maps/demo-spot";
import { loadGeocodingLibrary, loadMapLibraries } from "@/lib/maps/google-maps";
import { nameForPoint, shortAddress } from "@/lib/maps/place-name";

export type PickedCoords = { latitude: number; longitude: number };

type Props = {
  readonly value: PickedCoords | null; // where the pin is (null until the person picks a spot)
  readonly name: string; // the text in the address box
  readonly onPick: (coords: PickedCoords, name: string) => void;
  readonly onNameChange: (name: string) => void;
  readonly onUserLocation: (coords: PickedCoords) => void; // the person's real GPS position
};

type Point = { lat: number; lng: number };

const CAMPUS_BOUNDS = { south: 28.048, west: -82.43, north: 28.075, east: -82.396 };

function readPosition(marker: google.maps.marker.AdvancedMarkerElement): Point {
  const position = marker.position;
  if (!position) return { ...CAMPUS_CENTER };
  // A position is either a plain {lat, lng} or a Google LatLng object (with lat() and lng()).
  if (position instanceof google.maps.LatLng) return { lat: position.lat(), lng: position.lng() };
  return { lat: position.lat, lng: position.lng };
}

// Where is the problem? Search for a building or address, tap the map, or drag the pin.
// The address box and the pin stay in step: searching moves the pin, moving the pin fills the box.
export default function LocationPicker({ value, name, onPick, onNameChange, onUserLocation }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const containerRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<{
    map: google.maps.Map;
    marker: google.maps.marker.AdvancedMarkerElement;
    geocoder: google.maps.Geocoder;
  } | null>(null);
  const lastValid = useRef<Point>({ ...CAMPUS_CENTER });
  const startPoint = useRef<Point>(
    value ? { lat: value.latitude, lng: value.longitude } : { ...CAMPUS_CENTER },
  );
  const callbacks = useRef({ onPick, onNameChange, onUserLocation });

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    callbacks.current = { onPick, onNameChange, onUserLocation };
  });

  // Put the pin at a spot (if it is on campus), then fill in a place name for it.
  const placePin = useCallback(async (lat: number, lng: number, knownName?: string) => {
    if (!isNearCampus(lat, lng)) {
      setStatus("That spot is outside the USF Tampa campus area. Pick a spot closer to campus.");
      const current = runtime.current;
      if (current) current.marker.position = lastValid.current; // snap the pin back
      return;
    }
    setStatus("");
    lastValid.current = { lat, lng };
    const current = runtime.current;
    if (current) {
      current.marker.position = { lat, lng };
      current.map.panTo({ lat, lng });
    }
    const coords = { latitude: lat, longitude: lng };
    callbacks.current.onPick(coords, knownName ?? "");
    if (knownName === undefined && current) {
      const found = await nameForPoint(current.geocoder, lat, lng);
      callbacks.current.onPick(coords, found);
    }
  }, []);

  // Start the map, once.
  useEffect(() => {
    if (!apiKey) return;
    let alive = true;

    async function start() {
      try {
        const [{ maps, marker }, geocoding] = await Promise.all([
          loadMapLibraries(apiKey),
          loadGeocodingLibrary(apiKey),
        ]);
        if (!alive || containerRef.current === null) return;

        const map = new maps.Map(containerRef.current, {
          center: startPoint.current,
          zoom: 17,
          mapId,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const pin = new marker.PinElement({
          background: "#dc2626",
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          glyphText: "!",
          scale: 1.25,
        });
        const pinMarker = new marker.AdvancedMarkerElement({
          map,
          position: startPoint.current,
          gmpDraggable: true,
          content: pin.element,
          title: "Drag me to where the problem is",
        });

        pinMarker.addListener("dragend", () => {
          const point = readPosition(pinMarker);
          void placePin(point.lat, point.lng);
        });
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) void placePin(event.latLng.lat(), event.latLng.lng());
        });

        runtime.current = { map, marker: pinMarker, geocoder: new geocoding.Geocoder() };
        setLoadState("ready");
      } catch {
        if (alive) setLoadState("error");
      }
    }

    void start();
    return () => {
      alive = false;
      if (runtime.current) runtime.current.marker.map = null;
      runtime.current = null;
    };
  }, [apiKey, mapId, placePin]);

  // If the spot is set from outside (like a reset after submitting), move the pin to match.
  useEffect(() => {
    const current = runtime.current;
    if (!current) return;
    const target = value ? { lat: value.latitude, lng: value.longitude } : { ...CAMPUS_CENTER };
    current.marker.position = target;
    lastValid.current = target;
    current.map.panTo(target);
  }, [value, loadState]);

  async function search() {
    const text = name.trim();
    if (!text) return;
    setSearching(true);
    setStatus("");
    try {
      // Campus buildings first (their coordinates are hand-picked), then Google for addresses.
      const building = findBuildingByLabel(text);
      if (building) {
        await placePin(building.position.lat, building.position.lng, building.name);
        return;
      }
      const current = runtime.current;
      if (!current) {
        setStatus("Search needs the map. Try a building name like CIS or ENB, or use your location.");
        return;
      }
      const { results } = await current.geocoder.geocode({
        address: text,
        bounds: CAMPUS_BOUNDS,
        region: "us",
      });
      const match = results.find((result) =>
        isNearCampus(result.geometry.location.lat(), result.geometry.location.lng()),
      );
      if (!match) {
        setStatus("Couldn't find that place near campus. Try a building name, or tap the map.");
        return;
      }
      await placePin(
        match.geometry.location.lat(),
        match.geometry.location.lng(),
        shortAddress(match.formatted_address) || text,
      );
    } catch {
      setStatus("Search isn't available right now. Tap the map to place the pin.");
    } finally {
      setSearching(false);
    }
  }

  function useMyLocation() {
    setStatus("Finding you...");
    if (!navigator.geolocation) {
      setStatus("Location isn't available on this device. Search for the place instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const here = { lat: position.coords.latitude, lng: position.coords.longitude };
        callbacks.current.onUserLocation({ latitude: here.lat, longitude: here.lng });
        if (!isNearCampus(here.lat, here.lng)) {
          setStatus("You're outside the USF Tampa campus area. Search for the place or tap the map.");
          return;
        }
        void placePin(here.lat, here.lng);
        setStatus(`Location found (within about ${Math.round(position.coords.accuracy)} m)`);
      },
      () => setStatus("Couldn't get your location. Allow location access, or search for the place."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <h3 className="mb-1 text-sm font-bold">Where is it?</h3>
      <p className="mb-2 text-xs text-ink/60">
        Search for a building or address, tap the map, or drag the pin to the exact spot.
      </p>

      <div className="flex gap-2">
        <input
          id="locationName"
          value={name}
          onChange={(event) => callbacks.current.onNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          placeholder="Search a building or address"
          aria-label="Search a building or address"
          className="min-w-0 flex-1 rounded-2xl border border-ink/15 bg-cream p-3"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          aria-label="Search"
          className="flex items-center rounded-full bg-ink px-4 text-white disabled:opacity-50"
        >
          <Search className="size-4" />
        </button>
      </div>

      {apiKey && loadState !== "error" ? (
        <div
          ref={containerRef}
          role="application"
          aria-label="Map for placing the report pin"
          className="mt-3 h-56 overflow-hidden rounded-2xl border border-usf-green bg-mint-soft"
        />
      ) : (
        <p className="mt-3 rounded-2xl bg-cream p-3 text-xs text-ink/70">
          The map isn&apos;t available right now. You can still search for a building or use your location.
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="flex items-center gap-1.5 rounded-full bg-aqua px-4 py-2 text-sm font-semibold"
        >
          <LocateFixed className="size-4" />
          Use my location
        </button>
        <button
          type="button"
          onClick={() => {
            void placePin(DEMO_SPOT.lat, DEMO_SPOT.lng, DEMO_SPOT.label);
          }}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70"
        >
          Use demo spot
        </button>
      </div>

      {status && (
        <p className="mt-2 text-xs text-ink/70" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
