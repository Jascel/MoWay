import { Car, Footprints, MapPin } from "lucide-react";
import type { ClassEvent, Leg } from "@/data/mock";
import { formatTime, minusMinutes } from "@/lib/time";
import { categoryStyles } from "@/lib/categories";
import RouteChips from "@/components/RouteChips";

// One class/stop card, colored by category (like a calendar app).
function EventCard({ event }: { event: ClassEvent }) {
  const style = categoryStyles[event.category];
  const Icon = style.icon;
  return (
    <div className={`rounded-3xl p-4 ${style.bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">
          {formatTime(event.start)} - {formatTime(event.end)}
        </p>
        <span className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-semibold">
          <Icon className="size-3.5" />
          {style.label}
        </span>
      </div>
      <p className="mt-1 font-display text-xl font-extrabold leading-tight">{event.title}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm text-ink/80">
        <MapPin className="size-3.5" />
        {event.building}
        {event.room && ` ${event.room}`}
      </p>
    </div>
  );
}

function StepIcon({ mode }: { mode?: "walk" | "drive" }) {
  const Icon = mode === "drive" ? Car : Footprints;
  return <Icon className="size-4 shrink-0 text-leaf" />;
}

// The walk between two stops: "8 min walk, leave by 9:52" plus route chips.
function WalkConnector({ leg, arriveBy }: { leg: Leg; arriveBy: string }) {
  return (
    <div className="ml-6 border-l-2 border-dashed border-leaf/50 py-3 pl-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <StepIcon mode={leg.mode} />
        {leg.minutes} min {leg.steps ? "total" : leg.mode === "drive" ? "drive" : "walk"}, leave by{" "}
        {formatTime(minusMinutes(arriveBy, leg.minutes))}
      </p>
      {leg.steps && (
        <ul className="mt-1.5 space-y-1 text-xs text-ink/70">
          {leg.steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2">
              <StepIcon mode={step.mode} />
              {step.label} ({step.minutes} min)
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <RouteChips tags={leg.tags} />
      </div>
    </div>
  );
}

// Loops over events. For each one, first shows the walk that gets you there (if any), then the card.
export default function Timeline({ events, legs }: { events: ClassEvent[]; legs: Leg[] }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-extrabold">Your day</h2>
      {events.map((event) => {
        const leg = legs.find((l) => l.toEventId === event.id);
        return (
          <div key={event.id} className="mb-3">
            {leg && <WalkConnector leg={leg} arriveBy={event.start} />}
            <EventCard event={event} />
          </div>
        );
      })}
    </section>
  );
}
