import type { LucideIcon } from "lucide-react";
import {
  Accessibility, Ban, CircleHelp, Construction, DoorClosed, OctagonX, Waves,
} from "lucide-react";
import type { ConditionClass, ReportCategory, ReportImpact } from "@/data/mock";

// Bump the number if the saved report shape changes.
export const REPORTS_KEY = "moway.reports.v2";

// Icon + label for each kind of report. Order = order of the grid on the Report screen.
export const reportCategories: { value: ReportCategory; label: string; icon: LucideIcon }[] = [
  { value: "construction", label: "Construction", icon: Construction },
  { value: "blocked_sidewalk", label: "Blocked sidewalk", icon: Ban },
  { value: "sidewalk_ends", label: "Sidewalk ends", icon: OctagonX },
  { value: "accessible_entrance_closed", label: "Accessible entrance closed", icon: DoorClosed },
  { value: "flooding", label: "Flooding", icon: Waves },
  { value: "other", label: "Something else", icon: CircleHelp },
];

export const impactOptions: { value: ReportImpact; label: string; icon?: LucideIcon }[] = [
  { value: "inconvenience", label: "Just annoying" },
  { value: "blocks_walking", label: "Blocks walking" },
  { value: "blocks_scooter", label: "Blocks scooters" },
  { value: "blocks_wheelchair", label: "Blocks wheelchairs", icon: Accessibility },
  { value: "blocks_all", label: "Blocks everyone" },
];

export const durationOptions: { value: ConditionClass; label: string }[] = [
  { value: "temporary", label: "Temporary (about a day)" },
  { value: "infrastructure", label: "Stays until fixed" },
];

export function categoryInfo(value: ReportCategory) {
  return reportCategories.find((c) => c.value === value)!;
}
