import type { CampusBuilding, WalkingRouteResult } from "@/lib/maps/types";

type RoutePanelProps = {
  readonly route: WalkingRouteResult;
  readonly buildings: readonly CampusBuilding[];
};

function getBuildingName(
  buildings: readonly CampusBuilding[],
  buildingId: string,
): string {
  return buildings.find(({ id }) => id === buildingId)?.name ?? buildingId;
}

export default function RoutePanel({
  route,
  buildings,
}: RoutePanelProps) {
  const minutes = Math.ceil(route.durationMillis / 60_000);
  const miles = (route.distanceMeters / 1_609.344).toFixed(1);
  const originName = getBuildingName(buildings, route.originId);
  const destinationName = getBuildingName(buildings, route.destinationId);

  return (
    <section
      className="rounded-3xl bg-white p-4 shadow-sm"
      aria-labelledby="walking-route-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
        Walking estimate
      </p>
      <h2
        id="walking-route-heading"
        className="mt-2 text-lg font-bold leading-snug text-ink"
      >
        {originName} to {destinationName}
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-mint-soft p-3">
          <dt className="text-xs font-medium text-ink/60">Walking time</dt>
          <dd className="mt-1 text-xl font-bold">{minutes} min</dd>
        </div>
        <div className="rounded-2xl bg-aqua-soft p-3">
          <dt className="text-xs font-medium text-ink/60">Distance</dt>
          <dd className="mt-1 text-xl font-bold">{miles} mi</dd>
        </div>
      </dl>

      {route.warnings.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-ink/70">
          {route.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
