import type { ClassEvent, Leg } from "@/data/mock";
import { formatTime, minusMinutes } from "@/lib/time";
import { categoryStyles } from "@/lib/categories";

// One class/stop card, colored by category (like a calendar app).
function EventCard({ event }: { event: ClassEvent }) {
  const style = categoryStyles[event.category];
  return (
    <div className={`rounded-2xl p-4 text-white shadow-sm ${style.bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {formatTime(event.start)} - {formatTime(event.end)}
        </p>
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{style.label}</span>
      </div>
      <p className="mt-0.5 font-semibold">{event.title}</p>
      <p className="text-sm text-white/90">
        {event.building}
        {event.room && ` ${event.room}`}
      </p>
    </div>
  );
}

// The walk between two stops: "8 min walk, leave by 9:52" plus route chips.
function WalkConnector({ leg, arriveBy }: { leg: Leg; arriveBy: string }) {
  return (
    <div className="ml-4 border-l-2 border-dashed border-gray-300 py-3 pl-4">
      <p className="text-sm text-gray-700">
        {leg.mode === "drive" ? "🚗" : "🚶"} {leg.minutes} min {leg.mode === "drive" ? "drive" : "walk"}, leave by {formatTime(minusMinutes(arriveBy, leg.minutes))}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {leg.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-usf-green-light px-2 py-0.5 text-xs text-usf-green-dark">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// Loops over events. For each one, first shows the walk that gets you there (if any), then the card.
export default function Timeline({ events, legs }: { events: ClassEvent[]; legs: Leg[] }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold">Your day</h2>
      {events.map((event) => {
        const leg = legs.find((l) => l.toEventId === event.id);
        return (
          <div key={event.id}>
            {leg && <WalkConnector leg={leg} arriveBy={event.start} />}
            <EventCard event={event} />
          </div>
        );
      })}
    </section>
  );
}
