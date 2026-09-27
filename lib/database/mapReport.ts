import type { ConditionClass, Report, ReportCategory, ReportImpact } from "@/data/mock";
import type { getActiveReports } from "@/lib/database/reports";

type ReportRow = Awaited<ReturnType<typeof getActiveReports>>[number];

// Turns one database row from getActiveReports() into the Report shape the screens use.
export function rowToReport(r: ReportRow): Report {
  const minutesAgo = Math.max(0, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000));

  return {
    id: r.id,
    status: r.status,
    category: r.report_type as ReportCategory,
    impact: r.impact as ReportImpact,
    conditionClass: r.condition_class as ConditionClass,
    latitude: r.latitude,
    longitude: r.longitude,
    location: r.location_name || "Reported location",
    note: r.note || undefined,
    minutesAgo,
    confirmations: r.confirmation_count ?? 0,
    affectsRoute: false,
  };
}
