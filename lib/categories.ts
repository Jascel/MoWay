import type { EventCategory } from "@/data/mock";

// Color + label for each kind of event. Full class names are written out
// (not built with string tricks) so Tailwind can find them.
export const categoryStyles: Record<EventCategory, { label: string; bg: string }> = {
  class: { label: "Class", bg: "bg-teal-600" },
  meeting: { label: "Meeting", bg: "bg-orange-500" },
  club: { label: "Club", bg: "bg-pink-500" },
  fitness: { label: "Fitness", bg: "bg-emerald-500" },
  event: { label: "Event", bg: "bg-red-600" },
  work: { label: "Work", bg: "bg-purple-400" },
};
