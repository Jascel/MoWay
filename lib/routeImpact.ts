import type { ClassEvent, Leg } from "@/data/mock";

// When a report changes the day, which walk gets longer? Until real routing (Andres's) answers that,
// we pick the longest walk of the day: a blocked path hurts the longest walk the most.
// Returns the id of the event that walk leads to, or null if there is no walk to change.
export function pickAffectedLeg(events: ClassEvent[], legs: Leg[]): string | null {
  const walks = legs.filter(
    (leg) =>
      !leg.steps &&
      leg.mode !== "drive" &&
      events.some((e) => e.id === leg.toEventId) &&
      (leg.fromEventId === "parking" || leg.fromEventId === "home" || events.some((e) => e.id === leg.fromEventId))
  );
  if (walks.length === 0) return null;
  return walks.reduce((longest, leg) => (leg.distanceMeters > longest.distanceMeters ? leg : longest)).toEventId;
}
