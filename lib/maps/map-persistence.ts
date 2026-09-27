export const MAP_ROUTE_KEY = "moway.map.route.v1";

export type MapSelection = {
  readonly originId: string;
  readonly destinationId: string;
};

/** Restore only place IDs that are available in the current profile mode. */
export function restoreMapSelection(
  saved: MapSelection,
  availableOrigins: readonly string[],
  availableDestinations: readonly string[],
  defaultOriginId: string,
  defaultDestinationId: string,
): MapSelection {
  return {
    originId: availableOrigins.includes(saved.originId) ? saved.originId : defaultOriginId,
    destinationId: availableDestinations.includes(saved.destinationId)
      ? saved.destinationId
      : defaultDestinationId,
  };
}
