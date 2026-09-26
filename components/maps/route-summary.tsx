import type { CampusBuilding, WalkingRouteResult } from "@/lib/maps/types";

type RouteSummaryProps = {
  readonly route: WalkingRouteResult;
  readonly origin: CampusBuilding;
  readonly destination: CampusBuilding;
};

export function RouteSummary({
  route,
  origin,
  destination,
}: RouteSummaryProps) {
  const minutes = Math.ceil(route.durationMillis / 60_000);
  const miles = (route.distanceMeters / 1_609.344).toFixed(1);

  return (
    <section
      className="rounded-3xl bg-ice p-5 sm:p-6"
      aria-labelledby="walking-route-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
        Walking estimate
      </p>
      <h2
        id="walking-route-heading"
        className="mt-2 text-xl font-semibold tracking-tight text-ink"
      >
        {origin.name} to {destination.name}
      </h2>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink/60">
            Estimated time
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-ink">
            {minutes} min
          </dd>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink/60">
            Distance
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-ink">
            {miles} mi
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-ink/70">
        Google walking directions are an estimate. Check campus conditions and
        posted signs before you go.
      </p>
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
