export type MapPosition = {
  readonly lat: number;
  readonly lng: number;
};

export type CampusBuilding = {
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
