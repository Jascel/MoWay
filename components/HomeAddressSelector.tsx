"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { loadGeocodingLibrary } from "@/lib/maps/google-maps";

type AddressSuggestion = {
  readonly result: google.maps.GeocoderResult;
  readonly label: string;
  readonly secondaryLabel: string;
};

type SearchStatus = "idle" | "loading" | "ready" | "empty" | "error";

type SearchState = {
  readonly input: string;
  readonly status: SearchStatus;
  readonly suggestions: readonly AddressSuggestion[];
};

export default function HomeAddressSelector({
  id,
  value,
  onChange,
  placeholder = "Street address, city",
  className,
}: {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
}) {
  const listId = useId();
  const sequence = useRef(0);
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState<SearchState>({ input: "", status: "idle", suggestions: [] });
  const input = (isEditing ? draft : value).trim();
  const hasCurrentSearch = search.input === input && open;
  const suggestions = hasCurrentSearch ? search.suggestions : [];
  const status: SearchStatus = !open || input.length < 3
    ? "idle"
    : hasCurrentSearch
      ? search.status
      : "loading";

  useEffect(() => {
    const requestSequence = ++sequence.current;

    if (!open || input.length < 3) {
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(() => {
      setSearch({ input, status: "loading", suggestions: [] });
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setSearch({ input, status: "error", suggestions: [] });
        return;
      }

      void loadGeocodingLibrary(apiKey)
        .then(async (geocoding) => {
          if (cancelled || sequence.current !== requestSequence) return;
          const response = await new geocoding.Geocoder().geocode({ address: input, region: "us" });
          if (cancelled || sequence.current !== requestSequence) return;

          const suggestions = response.results.map((result) => {
            const [label, ...secondaryParts] = result.formatted_address.split(", ");
            return { result, label, secondaryLabel: secondaryParts.join(", ") };
          });

          setActiveIndex(0);
          setSearch({ input, status: suggestions.length > 0 ? "ready" : "empty", suggestions });
        })
        .catch(() => {
          if (!cancelled && sequence.current === requestSequence) {
            setSearch({ input, status: "error", suggestions: [] });
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [input, open]);

  function selectSuggestion(suggestion: AddressSuggestion): void {
    sequence.current += 1;
    selectAddress(suggestion.result.formatted_address);
  }

  function selectAddress(formattedAddress: string): void {
    setDraft(formattedAddress);
    setIsEditing(false);
    setOpen(false);
    setSearch({ input: formattedAddress.trim(), status: "idle", suggestions: [] });
    onChange(formattedAddress);
  }

  function clearAddress(): void {
    sequence.current += 1;
    setDraft("");
    setIsEditing(false);
    setOpen(false);
    setSearch({ input: "", status: "idle", suggestions: [] });
    onChange("");
  }

  const statusMessage = {
    idle: input.length < 3 ? "Type at least 3 characters to search addresses." : "",
    loading: "Searching addresses…",
    ready: "Choose an address from the suggestions.",
    empty: "No addresses found. Try adding a city or ZIP code.",
    error: "Address suggestions are unavailable. Try again in a moment.",
  }[status];

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && suggestions[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          value={isEditing ? draft : value}
          placeholder={placeholder}
          className={`${className ?? "w-full rounded-2xl border border-ink/15 bg-cream p-3"} ${value ? "pr-11" : ""}`}
          onFocus={() => {
            setDraft(value);
            setIsEditing(true);
            setOpen(true);
          }}
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            setDraft(value);
            setIsEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && suggestions.length > 0) {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp" && suggestions.length > 0) {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
              event.preventDefault();
              void selectSuggestion(suggestions[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
              setDraft(value);
              setIsEditing(false);
            }
          }}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear home address"
            onPointerDown={(event) => event.preventDefault()}
            onClick={clearAddress}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-usf-green"
          >
            Clear
          </button>
        )}
        {open && (
          <div className="absolute z-30 mt-1 w-full min-w-[16rem] overflow-hidden rounded-2xl border border-ink/10 bg-white p-1 shadow-lg">
            <ul id={listId} role="listbox" aria-label="Address suggestions" className="max-h-64 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  id={`${listId}-option-${index}`}
                  key={suggestion.result.place_id}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    index === activeIndex ? "bg-mint-soft" : ""
                  }`}
                >
                  <MapPin className="size-4 shrink-0 text-leaf" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{suggestion.label}</span>
                    {suggestion.secondaryLabel && (
                      <span className="block truncate text-xs text-ink/60">{suggestion.secondaryLabel}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 px-3 py-2 text-xs text-[#5e5e5e]" translate="no">
              Google Maps
            </div>
            {statusMessage && (
              <p role="status" aria-live="polite" className="px-3 py-2 text-xs text-ink/65">
                {statusMessage}
              </p>
            )}
          </div>
        )}
      </div>
      {value && (
        <p className="mt-1 text-xs text-ink/65">
          Selected address: <span className="font-semibold text-ink">{value}</span>
        </p>
      )}
    </div>
  );
}
