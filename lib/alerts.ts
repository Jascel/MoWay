import type { Report, RouteAlert } from "@/data/mock";
import { categoryInfo } from "@/lib/reportCategories";

// Turns a report into the "Your day changed" alert. The 3 extra minutes is a stand-in;
// Andres's routing will calculate the real number later.
export function alertFromReport(report: Report): RouteAlert {
  const info = categoryInfo(report.category);
  return {
    reportId: report.id,
    message: `${info.label} at ${report.location}. Your route now takes 3 min longer.`,
    extraMinutes: 3,
  };
}

// Both screens read and write the alert under this localStorage key.
export const ALERT_KEY = "moway.activeAlert";
