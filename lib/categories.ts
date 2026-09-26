import type { LucideIcon } from "lucide-react";
import { Briefcase, CalendarDays, Dumbbell, GraduationCap, Heart, Users } from "lucide-react";
import type { EventCategory } from "@/data/mock";

// Color, label and icon for each kind of event. Full class names are written out
// (not built with string tricks) so Tailwind can find them.
export const categoryStyles: Record<EventCategory, { label: string; bg: string; icon: LucideIcon }> = {
  class: { label: "Class", bg: "bg-ice", icon: GraduationCap },
  meeting: { label: "Meeting", bg: "bg-sun", icon: Users },
  club: { label: "Club", bg: "bg-blush", icon: Heart },
  fitness: { label: "Fitness", bg: "bg-mint", icon: Dumbbell },
  event: { label: "Event", bg: "bg-coral", icon: CalendarDays },
  work: { label: "Work", bg: "bg-lilac", icon: Briefcase },
};
