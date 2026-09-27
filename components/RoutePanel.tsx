import { categoryInfo } from "@/lib/reportCategories";
import type { CampusPlace } from "@/lib/maps/types";
import type { CampusMode } from "@/lib/profileMode";
import type { RouteChoice } from "@/lib/maps/route-hazards";

type RoutePanelProps = {
  readonly choice: RouteChoice;
  readonly places: readonly CampusPlace[];
  readonly mode: CampusMode;
};

function getPlaceName(places: readonly CampusPlace[], id: string): string {
  return places.find((place) => place.id === id)?.name ?? id;
}

function statusMessage(choice: RouteChoice): string {
  switch (choice.status) {
    case "rerouted": return "Confirmed barrier avoided. This route adds time to keep you moving.";
    case "watching": return "Watching an unconfirmed report near this route.";
    case "unaffected": return "A nearby report does not affect your route.";
    case "blocked": return "All available routes have confirmed barriers.";
    default: return "No reported hazards on this route.";
  }
}

export default function RoutePanel({ choice, places, mode }: RoutePanelProps) {
  const route = choice.chosen;
  if (route === null) return null;

  const minutes = choice.selectedMinutes;
  const miles = (route.distanceMeters / 1_609.344).toFixed(1);
  const originName = getPlaceName(places, route.originId);
  const destinationName = getPlaceName(places, route.destinationId);
  // The status line above already says this for "unaffected", so drop the chip that repeats it.
  const routeChips = choice.chips.filter((chip) => chip !== "Doesn't affect your route.");

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm" aria-labelledby="walking-route-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{mode} estimate</p>
      <h2 id="walking-route-heading" className="mt-2 text-lg font-bold leading-snug text-ink">
        {originName} to {destinationName}
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-mint-soft p-3">
          <dt className="text-xs font-medium text-ink/60">{mode === "wheelchair" ? "Rolling time" : "Travel time"}</dt>
          <dd className="mt-1 text-xl font-bold">{minutes} min</dd>
        </div>
        <div className="rounded-2xl bg-aqua-soft p-3">
          <dt className="text-xs font-medium text-ink/60">Distance</dt>
          <dd className="mt-1 text-xl font-bold">{miles} mi</dd>
        </div>
      </dl>

      <p className="mt-4 rounded-2xl bg-sand px-3 py-2 text-sm leading-5 text-ink" role="status">
        {statusMessage(choice)}
      </p>

      {routeChips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Route details">
          {routeChips.map((chip) => (
            <span key={chip} className="rounded-full bg-aqua-soft px-3 py-1 text-xs font-semibold text-ink">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {choice.hazards.length > 0 ? (
        <p className="mt-3 text-sm leading-6 text-ink/70">
          <span className="font-semibold text-ink">Hazard status:</span>{" "}
          {choice.hazards.map((report) => `${categoryInfo(report.category).label} (${report.status})`).join(" · ")}
        </p>
      ) : null}

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
