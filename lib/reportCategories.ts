import type { LucideIcon } from "lucide-react";
import { Accessibility, CircleHelp, Construction, LightbulbOff, OctagonX, PartyPopper, Waves } from "lucide-react";
import type { ReportCategory } from "@/data/mock";

// Icon + label for each kind of report. Order = order of the grid on the Report screen.
export const reportCategories: { value: ReportCategory; label: string; icon: LucideIcon }[] = [
  { value: "construction", label: "Construction", icon: Construction },
  { value: "sidewalk_closed", label: "Sidewalk closed", icon: OctagonX },
  { value: "accessibility_barrier", label: "Accessibility barrier", icon: Accessibility },
  { value: "flooding", label: "Flooding", icon: Waves },
  { value: "poor_lighting", label: "Poor lighting", icon: LightbulbOff },
  { value: "event_reroute", label: "Event / reroute", icon: PartyPopper },
  { value: "other", label: "Something else", icon: CircleHelp },
];

export function categoryInfo(value: ReportCategory) {
  return reportCategories.find((c) => c.value === value)!;
}
