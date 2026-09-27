import assert from "node:assert/strict";
import { test } from "node:test";
import { rowToReport } from "@/lib/database/mapReport";

for (const status of ["unconfirmed", "confirmed"] as const) {
  test(`preserves ${status} status when mapping an active row`, () => {
    // Given a database report in either active state.
    const row = {
      id: "report", status, report_type: "blocked_sidewalk", impact: "blocks_wheelchair",
      condition_class: "temporary", latitude: 28, longitude: -82, location_name: "Path",
      note: null, created_at: new Date().toISOString(), confirmation_count: 1,
    };
    // When the frontend adapter maps it.
    const report = rowToReport(row);
    // Then status survives instead of being inferred from confirmations.
    assert.equal(report.status, status);
  });
}
