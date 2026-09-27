"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  InvalidWalkingRouteError,
  NoWalkingRouteError,
  computeWalkingRoute,
} from "@/lib/maps/walking-route";
import type { CampusPlace, WalkingRouteResult } from "@/lib/maps/types";

export type WalkingRouteState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | {
      readonly kind: "success";
      readonly candidates: readonly WalkingRouteResult[];
      readonly route: WalkingRouteResult;
    }
  | { readonly kind: "error"; readonly message: string };

function routeErrorMessage(error: unknown): string {
  if (error instanceof NoWalkingRouteError) {
    return "No walking route was found. Try another pair of buildings.";
  }

  if (error instanceof InvalidWalkingRouteError) {
    return "The route response was incomplete. Please try again.";
  }

  return "The walking route could not be loaded. Check your connection and try again.";
}

export function useWalkingRoute(
  apiKey: string,
  origin: CampusPlace,
  destination: CampusPlace,
): {
  readonly state: WalkingRouteState;
  readonly requestRoute: () => Promise<void>;
  readonly resetRoute: () => void;
} {
  const [state, setState] = useState<WalkingRouteState>({ kind: "idle" });
  const requestVersion = useRef(0);
  const pending = useRef(false);

  const resetRoute = useCallback((): void => {
    requestVersion.current += 1;
    pending.current = false;
    setState({ kind: "idle" });
  }, []);

  useEffect(
    () => () => {
      requestVersion.current += 1;
      pending.current = false;
    },
    [],
  );

  const requestRoute = useCallback(async (): Promise<void> => {
    if (pending.current || origin.id === destination.id) {
      return;
    }

    pending.current = true;
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setState({ kind: "loading" });

    try {
      const candidates = await computeWalkingRoute(apiKey, origin, destination);
      const route = candidates[0];
      if (route === undefined) {
        throw new NoWalkingRouteError();
      }

      if (requestVersion.current === version) {
        setState({ kind: "success", candidates, route });
      }
    } catch (error: unknown) {
      if (requestVersion.current === version) {
        setState({ kind: "error", message: routeErrorMessage(error) });
      }
    } finally {
      if (requestVersion.current === version) {
        pending.current = false;
      }
    }
  }, [apiKey, destination, origin]);

  return { state, requestRoute, resetRoute };
}
