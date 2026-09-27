import assert from "node:assert/strict";
import { test } from "node:test";
import { mockReport, type Mode, type Report, type ReportImpact } from "@/data/mock";
import { chooseRoute, hazardsOnRoute, isBlockingForMe } from "@/lib/maps/route-hazards";
import type { WalkingRouteResult } from "@/lib/maps/types";

const fast: WalkingRouteResult = { originId: "garage", destinationId: "class", distanceMeters: 500,
  durationMillis: 100000, path: [{ lat: 0, lng: 0 }, { lat: 0, lng: 0.01 }], warnings: [] };
const alternate: WalkingRouteResult = { ...fast, distanceMeters: 600,
  path: [{ lat: 0.001, lng: 0 }, { lat: 0.001, lng: 0.01 }] };
const report: Report = { ...mockReport, latitude: 0, longitude: 0.005 };
const modes: readonly Mode[] = ["walking", "wheelchair", "scooter", "bike", "driving", "transit"];
const blocked: Readonly<Record<ReportImpact, readonly Mode[]>> = {
  blocks_all: modes, blocks_walking: ["walking"], blocks_wheelchair: ["wheelchair"],
  blocks_scooter: ["scooter"], inconvenience: [],
};
const impacts: readonly ReportImpact[] = ["blocks_all", "blocks_walking", "blocks_wheelchair", "blocks_scooter", "inconvenience"];
for (const impact of impacts) {
  for (const mode of modes) {
    test(`${impact} blocking matrix for ${mode}`, () => {
      const input = { ...report, impact };
      assert.equal(isBlockingForMe(input, mode), blocked[impact].includes(mode));
    });
  }
}
test("confirmed wheelchair report reroutes with ordered metadata", () => {
  const result = chooseRoute([alternate, fast], [report], "wheelchair");
  assert.equal(result.chosen, alternate);
  assert.deepEqual(result.rejected, [fast]);
  assert.equal(result.selectedMinutes, 9);
  assert.equal(result.extraMinutes, 2);
  assert.equal(result.status, "rerouted");
  assert.deepEqual(result.hazards, [report]);
  assert.ok(result.chips.includes("+2 min"));
  assert.ok(result.chips.includes("Avoids blocked sidewalk"));
});
test("multiple alternatives compare the chosen route with the fastest physical baseline", () => {
  const longer = { ...alternate, distanceMeters: 850,
    path: [{ lat: 0.002, lng: 0 }, { lat: 0.002, lng: 0.01 }] };
  const result = chooseRoute([fast, longer, alternate], [report], "wheelchair");

  assert.equal(result.chosen, alternate);
  assert.deepEqual(result.rejected, [longer, fast]);
  assert.equal(result.selectedMinutes, 9);
  assert.equal(result.extraMinutes, 2);
  assert.ok(result.chips.includes("+2 min"));
});
test("unconfirmed blocker warns without rerouting", () => {
  const result = chooseRoute([fast, alternate], [{ ...report, status: "unconfirmed" }], "wheelchair");
  assert.equal(result.chosen, fast);
  assert.equal(result.extraMinutes, 0);
  assert.equal(result.status, "watching");
  assert.ok(result.chips.includes("Watching a report."));
});
test("mode change returns fastest route for an unaffected walker", () => {
  const result = chooseRoute([fast, alternate], [report], "walking");
  assert.equal(result.chosen, fast);
  assert.equal(result.selectedMinutes, 6);
  assert.equal(result.status, "unaffected");
  assert.equal(result.extraMinutes, 0);
  assert.ok(!result.chips.some((chip) => /^\+\d+ min$/.test(chip)));
});
test("inconvenience nudges by two minutes without inflating travel time", () => {
  const annoying: Report = { ...report, impact: "inconvenience", status: "unconfirmed" };
  const close = { ...alternate, distanceMeters: 550 };
  const far = { ...alternate, distanceMeters: 800 };
  assert.equal(chooseRoute([fast, close], [annoying], "walking").chosen, close);
  const result = chooseRoute([fast, far], [annoying], "walking");
  assert.equal(result.chosen, fast);
  assert.equal(result.extraMinutes, 0);
});
test("all blocked chooses fewest blockers then fastest and warns", () => {
  const other = { ...report, id: "other", latitude: 0.001 };
  const third = { ...report, id: "third" };
  const result = chooseRoute([fast, alternate], [report, other, third], "wheelchair");
  assert.equal(result.chosen, alternate);
  assert.equal(result.selectedMinutes, 9);
  assert.equal(result.extraMinutes, 2);
  assert.equal(result.status, "blocked");
  assert.ok(result.chips.includes("All routes have confirmed barriers."));
});
test("25m is included and a point just beyond it is excluded", () => {
  const degree = 180 / (Math.PI * 6_371_008.8);
  assert.equal(hazardsOnRoute(fast, [{ ...report, latitude: 25 * degree }]).length, 1);
  assert.equal(hazardsOnRoute(fast, [{ ...report, latitude: 25.001 * degree }]).length, 0);
});
test("empty candidates retain the complete result contract", () => {
  assert.deepEqual(chooseRoute([], [report], "walking"), {
    chosen: null, rejected: [], selectedMinutes: 0, extraMinutes: 0, chips: [], hazards: [], status: "unavailable",
  });
});
test("clear choice preserves stable ties and input order without mutation", () => {
  const tied = { ...fast };
  const input = Object.freeze([alternate, fast, tied]);
  const result = chooseRoute(input, [], "walking");
  assert.equal(result.chosen, fast);
  assert.equal(result.selectedMinutes, 6);
  assert.equal(result.extraMinutes, 0);
  assert.deepEqual(result.rejected, [tied, alternate]);
  assert.equal(result.status, "clear");
  assert.deepEqual(input, [alternate, fast, tied]);
});
