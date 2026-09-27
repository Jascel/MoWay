import type { ReportCategory } from "@/data/mock";

// A color for each kind of report, so a pin tells you what it is at a glance.
// Strong colors on purpose: they have to stand out on a map, unlike the soft app colors.
export const pinColors: Record<ReportCategory, string> = {
  construction: "#f59e0b",
  blocked_sidewalk: "#dc2626",
  sidewalk_ends: "#f97316",
  accessible_entrance_closed: "#7c3aed",
  flooding: "#2563eb",
  poor_lighting: "#1f2a44",
  other: "#6b7280",
};

export function pinColor(category: ReportCategory): string {
  return pinColors[category] ?? pinColors.other;
}
