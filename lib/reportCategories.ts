import type { ReportCategory } from "@/data/mock";

// Icon + label for each kind of report. Order = order of the grid on the Report screen.
export const reportCategories: { value: ReportCategory; label: string; icon: string }[] = [
  { value: "construction", label: "Construction", icon: "🚧" },
  { value: "sidewalk_closed", label: "Sidewalk closed", icon: "⛔" },
  { value: "accessibility_barrier", label: "Accessibility barrier", icon: "♿" },
  { value: "flooding", label: "Flooding", icon: "🌊" },
  { value: "poor_lighting", label: "Poor lighting", icon: "🔦" },
  { value: "event_reroute", label: "Event / reroute", icon: "🎪" },
  { value: "other", label: "Something else", icon: "❓" },
];

export function categoryInfo(value: ReportCategory) {
  return reportCategories.find((c) => c.value === value)!;
}
