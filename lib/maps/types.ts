export type MapPosition = {
  readonly lat: number;
  readonly lng: number;
};

export type CampusBuilding = {
  readonly id: string;
  /** USF building code as it appears on schedules, e.g. "CIS", "ENB". */
  readonly code: string;
  readonly name: string;
  /** Extra labels that should resolve to this building (see findBuildingByLabel). */
  readonly aliases?: readonly string[];
  readonly position: MapPosition;
};

export type CampusGarage = {
  readonly id: string;
  readonly name: string;
  readonly position: MapPosition;
};

export type WalkingRouteResult = {
  readonly originId: string;
  readonly destinationId: string;
  readonly durationMillis: number;
  readonly distanceMeters: number;
  readonly path: readonly MapPosition[];
  readonly warnings: readonly string[];
};
