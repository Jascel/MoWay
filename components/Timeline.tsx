"use client";

import { useState } from "react";
import { Car, Footprints, House, MapPin, Pencil, Trash2 } from "lucide-react";
import type { ClassEvent, Leg } from "@/data/mock";
import { formatTime, minusMinutes, plusMinutes } from "@/lib/time";
import { categoryStyles } from "@/lib/categories";
import RouteChips from "@/components/RouteChips";

// One class/stop card, colored by category (like a calendar app).
function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: ClassEvent;
  onEdit?: (event: ClassEvent) => void;
  onDelete?: (event: ClassEvent) => void;
}) {
  const style = categoryStyles[event.category];
  const Icon = style.icon;
  const [confirming, setConfirming] = useState(false);
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
      <p className="mt-1 text-xl font-bold leading-tight">{event.title}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm text-ink/80">
        <MapPin className="size-3.5" />
        {event.building}
        {event.room && ` ${event.room}`}
      </p>

      {(onEdit || onDelete) && (
        <div className="mt-3 flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs font-semibold">Delete this?</span>
              <button
                onClick={() => {
                  onDelete?.(event);
                  setConfirming(false);
                }}
                className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"
              >
                Yes, delete
              </button>
              <button onClick={() => setConfirming(false)} className="text-xs underline">
                Cancel
              </button>
            </>
          ) : (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  aria-label={`Edit ${event.title}`}
                  className="flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold"
                >
                  <Pencil className="size-3" /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setConfirming(true)}
                  aria-label={`Delete ${event.title}`}
                  className="flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold"
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepIcon({ mode }: { mode?: "walk" | "drive" }) {
  const Icon = mode === "drive" ? Car : Footprints;
  return <Icon className="size-4 shrink-0 text-leaf" />;
}

// The walk between two stops: "8 min walk, leave by 9:52" plus route chips.
function WalkConnector({ leg, arriveBy, extraMinutes = 0 }: { leg: Leg; arriveBy: string; extraMinutes?: number }) {
  const minutes = leg.minutes + extraMinutes;
  const changed = extraMinutes > 0;
  return (
    <div
      key={changed ? "changed" : "normal"}
      className={
        changed
          ? "animate-flash my-2 ml-3 rounded-2xl border-l-4 border-dashed border-sun bg-sun/30 py-3 pl-4 pr-3"
          : "ml-6 border-l-2 border-dashed border-leaf/50 py-3 pl-4"
      }
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <StepIcon mode={leg.mode} />
        {minutes} min {leg.steps ? "total" : leg.mode === "drive" ? "drive" : "walk"}, leave by{" "}
        {formatTime(minusMinutes(arriveBy, minutes))}
        {changed && <span className="text-xs font-semibold text-ink/60">(was {leg.minutes} min)</span>}
      </p>
      {changed && (
        <p className="mt-1 text-xs font-medium text-ink/70">A new report is affecting this walk.</p>
      )}
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
        <RouteChips tags={changed ? [`+${extraMinutes} min`, ...leg.tags] : leg.tags} />
      </div>
    </div>
  );
}

// The trip home after your last stop: a short walk to the car, then the drive.
function HomeTrip({ last, walkMinutes, driveMinutes }: { last: ClassEvent; walkMinutes: number; driveMinutes: number }) {
  const total = walkMinutes + driveMinutes;
  return (
    <div className="mb-3">
      <div className="ml-6 border-l-2 border-dashed border-leaf/50 py-3 pl-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Car className="size-4 shrink-0 text-leaf" />
          {total} min total, leave after {last.title} ({formatTime(last.end)})
        </p>
        <ul className="mt-1.5 space-y-1 text-xs text-ink/70">
          <li className="flex items-center gap-2">
            <Footprints className="size-4 shrink-0 text-leaf" />
            Walk to your car ({walkMinutes} min)
          </li>
          <li className="flex items-center gap-2">
            <Car className="size-4 shrink-0 text-leaf" />
            Drive home ({driveMinutes} min)
          </li>
        </ul>
      </div>
      <div className="flex items-center justify-between rounded-3xl bg-aqua p-4">
        <div>
          <p className="text-sm font-bold">Home</p>
          <p className="text-sm text-ink/70">Arrive about {formatTime(plusMinutes(last.end, total))}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/60">
          <House className="size-5 text-leaf" />
        </div>
      </div>
    </div>
  );
}

// Loops over events. For each one, first shows the walk that gets you there (if any), then the card.
export default function Timeline({
  events,
  legs,
  homeTrip,
  onEdit,
  onDelete,
  hiddenCount = 0,
  onRestore,
  affected,
}: {
  events: ClassEvent[];
  legs: Leg[];
  homeTrip?: { walkMinutes: number; driveMinutes: number };
  onEdit?: (event: ClassEvent) => void;
  onDelete?: (event: ClassEvent) => void;
  hiddenCount?: number;
  onRestore?: () => void;
  affected?: { toEventId: string; extraMinutes: number } | null;
}) {
  return (
    <section>
      <h2 className="font-display mb-3 text-2xl font-bold">Your day</h2>
      {events.map((event) => {
        // Only show the walk if the stop it starts from is still on the schedule.
        const leg = legs.find(
          (l) =>
            l.toEventId === event.id &&
            (l.fromEventId === "parking" || l.fromEventId === "home" || events.some((e) => e.id === l.fromEventId))
        );
        return (
          <div key={event.id} className="mb-3">
            {leg && (
              <WalkConnector
                leg={leg}
                arriveBy={event.start}
                extraMinutes={affected?.toEventId === event.id ? affected.extraMinutes : 0}
              />
            )}
            <EventCard event={event} onEdit={onEdit} onDelete={onDelete} />
          </div>
        );
      })}
      {homeTrip && events.length > 0 && (
        <HomeTrip last={events[events.length - 1]} walkMinutes={homeTrip.walkMinutes} driveMinutes={homeTrip.driveMinutes} />
      )}
      {hiddenCount > 0 && onRestore && (
        <button onClick={onRestore} className="mb-3 text-sm text-ink/60 underline">
          Restore {hiddenCount} deleted {hiddenCount === 1 ? "event" : "events"}
        </button>
      )}
    </section>
  );
}
