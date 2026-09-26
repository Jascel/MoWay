"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Like useState, but remembers the value in the browser (localStorage) under `key`.
// Returns [value, save]. Call save(newValue) to store it and re-draw every component using this key.
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

  function save(next: T) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage blocked: ignore
    }
    listeners.forEach((l) => l());
  }

  return [value, save] as const;
}
