"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getActiveReports } from "@/lib/database/reports";
import { subscribeToReports } from "@/lib/database/realtime";

type ActiveReports = Awaited<
  ReturnType<typeof getActiveReports>
>;

export function useActiveReports() {
  const [reports, setReports] =
    useState<ActiveReports>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const activeReports =
        await getActiveReports();

      setReports(activeReports);
      setError(null);
    } catch (err) {
      console.error(
        "Could not load active reports:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load active reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      if (!active) {
        return;
      }

      await refresh();
    }

    void initialLoad();

    // Retry once because anonymous authentication
    // may still be initializing on first load.
    const retry = window.setTimeout(() => {
      if (active) {
        void refresh();
      }
    }, 3000);

    // Any report or confirmation change causes
    // the full active report list to refresh.
    const unsubscribe = subscribeToReports(() => {
      if (active) {
        void refresh();
      }
    });

    return () => {
      active = false;
      window.clearTimeout(retry);
      unsubscribe();
    };
  }, [refresh]);

  return {
    reports,
    loading,
    error,
    refresh,
  };
}