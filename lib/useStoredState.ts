"use client";

import { useCallback, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Like useState, but remembers the value in the browser (localStorage) under `key`.
// Returns [value, save, loaded]. Call save(newValue) to store it and re-draw every component using this key.
// useSyncExternalStore is React's built-in way to read something outside React (here: localStorage).
export function useStoredState<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null // on the server there is no localStorage
  );

  let value = initial;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      // bad data: fall back to initial
    }
  }

  const save = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage blocked: ignore
      }
      listeners.forEach((l) => l());
    },
    [key]
  );

  // false while the page is still loading in the browser, then true. Lets a screen wait for the saved value.
  const loaded = useSyncExternalStore(noSubscription, () => true, () => false);

  return [value, save, loaded] as const;
}
