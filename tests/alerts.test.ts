import assert from "node:assert/strict";
import { test } from "node:test";

import { mockReport } from "@/data/mock";
import {
  alertFromChoice,
  alertFromClearedReport,
  leaveByForFirstLeg,
  reportForChoice,
  reconcileAlert,
} from "@/lib/alerts";
import type { RouteChoice } from "@/lib/maps/route-hazards";

function choice(status: RouteChoice["status"], extraMinutes: number): RouteChoice {
  return {
    chosen: null,
    rejected: [],
    selectedMinutes: 0,
    extraMinutes,
    chips: [],
    hazards: [],
    status,
  };
}

test("confirmed route choice uses the computed extra minutes", () => {
  const result = alertFromChoice(choice("rerouted", 4), mockReport, "wheelchair");

  assert.ok(result);
  assert.equal(result.reportId, mockReport.id);
  assert.equal(result.extraMinutes, 4);
  assert.match(result.message, /\+4 min/);
});

test("the same report gets a watching alert before confirmation", () => {
  const result = alertFromChoice(choice("watching", 0), mockReport, "wheelchair");

  assert.ok(result);
  assert.equal(result.reportId, mockReport.id);
  assert.equal(result.extraMinutes, 0);
  assert.match(result.message, /watching/);
});

test("unaffected and incomplete route choices do not shift leave-by", () => {
  assert.equal(alertFromChoice(choice("unaffected", 8), mockReport, "walking")?.extraMinutes, 0);
  assert.equal(alertFromChoice(choice("unavailable", 8), mockReport, "wheelchair"), null);
  assert.equal(alertFromChoice(choice("clear", 8), null, "wheelchair"), null);
});

test("clearing a report is a separate transition and restores normal timing", () => {
  const result = alertFromClearedReport(mockReport.id);

  assert.equal(result.reportId, mockReport.id);
  assert.equal(result.extraMinutes, 0);
  assert.match(result.message, /Cleared/);
  assert.equal(leaveByForFirstLeg("09:06", 26, 11), "08:29");
});

function transitionInput(
  overrides: Partial<Parameters<typeof reconcileAlert>[0]>,
): Parameters<typeof reconcileAlert>[0] {
  return {
    storedAlert: null,
    seenIdentity: null,
    reports: [],
    routeReport: null,
    choice: choice("clear", 0),
    mode: "wheelchair",
    originId: "garage",
    destinationId: "class",
    refresh: "success",
    ...overrides,
  };
}

test("same-id confirmation changes the transition identity and alert", () => {
  const unconfirmed = { ...mockReport, status: "unconfirmed" as const };
  const watching = reconcileAlert(transitionInput({
    reports: [unconfirmed],
    routeReport: unconfirmed,
    choice: choice("watching", 0),
  }));
  assert.ok(watching);

  const confirmed = mockReport;
  const rerouted = reconcileAlert(transitionInput({
    storedAlert: { ...watching.alert, identity: watching.identity },
    seenIdentity: watching.identity,
    reports: [confirmed],
    routeReport: confirmed,
    choice: choice("rerouted", 3),
  }));
  assert.ok(rerouted);
  assert.notEqual(rerouted.identity, watching.identity);
  assert.equal(rerouted.alert.extraMinutes, 3);
});

test("a dismissed alert stays dismissed until confirmation changes the result", () => {
  const unconfirmed = { ...mockReport, status: "unconfirmed" as const };
  const watching = reconcileAlert(transitionInput({
    reports: [unconfirmed],
    routeReport: unconfirmed,
    choice: choice("watching", 0),
  }));
  assert.ok(watching);

  const dismissed = reconcileAlert(transitionInput({
    seenIdentity: watching.identity,
    reports: [unconfirmed],
    routeReport: unconfirmed,
    choice: choice("watching", 0),
  }));
  assert.equal(dismissed, null);

  const confirmed = reconcileAlert(transitionInput({
    seenIdentity: watching.identity,
    reports: [mockReport],
    routeReport: mockReport,
    choice: choice("rerouted", 3),
  }));
  assert.ok(confirmed);
  assert.equal(confirmed.alert.status, "rerouted");
});

test("a mode flip produces an unaffected transition for the same active report", () => {
  const rerouted = reconcileAlert(transitionInput({
    reports: [mockReport],
    routeReport: mockReport,
    choice: choice("rerouted", 3),
  }));
  assert.ok(rerouted);

  const walking = reconcileAlert(transitionInput({
    storedAlert: { ...rerouted.alert, identity: rerouted.identity },
    seenIdentity: rerouted.identity,
    reports: [mockReport],
    routeReport: mockReport,
    choice: choice("unaffected", 0),
    mode: "walking",
  }));
  assert.ok(walking);
  assert.equal(walking.alert.status, "unaffected");
  assert.equal(walking.alert.extraMinutes, 0);
});

test("successful disappearance clears, while a failed refresh preserves the last result", () => {
  const rerouted = reconcileAlert(transitionInput({
    reports: [mockReport],
    routeReport: mockReport,
    choice: choice("rerouted", 3),
  }));
  assert.ok(rerouted);

  const failed = reconcileAlert(transitionInput({
    storedAlert: { ...rerouted.alert, identity: rerouted.identity },
    seenIdentity: rerouted.identity,
    reports: [mockReport],
    choice: choice("clear", 0),
    refresh: "error",
  }));
  assert.equal(failed, null);

  const cleared = reconcileAlert(transitionInput({
    storedAlert: { ...rerouted.alert, identity: rerouted.identity },
    seenIdentity: rerouted.identity,
    reports: [],
    choice: choice("clear", 0),
  }));
  assert.ok(cleared);
  assert.equal(cleared.alert.status, "cleared");
});

test("an active report that no longer intersects the route is not called cleared", () => {
  const rerouted = reconcileAlert(transitionInput({
    reports: [mockReport],
    routeReport: mockReport,
    choice: choice("rerouted", 3),
  }));
  assert.ok(rerouted);

  const unaffected = reconcileAlert(transitionInput({
    storedAlert: { ...rerouted.alert, identity: rerouted.identity },
    seenIdentity: rerouted.identity,
    reports: [mockReport],
    choice: choice("clear", 0),
  }));
  assert.ok(unaffected);
  assert.equal(unaffected.alert.status, "unaffected");
  assert.doesNotMatch(unaffected.alert.message, /Cleared/);
});

test("a dismissed unaffected transition does not become a false clearance", () => {
  const first = reconcileAlert(transitionInput({
    reports: [mockReport],
    routeReport: mockReport,
    choice: choice("rerouted", 3),
  }));
  assert.ok(first);
  const unaffected = reconcileAlert(transitionInput({
    storedAlert: { ...first.alert, identity: first.identity },
    seenIdentity: first.identity,
    reports: [mockReport],
    choice: choice("clear", 0),
  }));
  assert.ok(unaffected);

  const dismissed = reconcileAlert(transitionInput({
    seenIdentity: unaffected.identity,
    reports: [mockReport],
    choice: choice("clear", 0),
  }));
  assert.equal(dismissed, null);
});

test("reroute attribution prefers a confirmed blocker over an unrelated hazard", () => {
  const unconfirmed = { ...mockReport, id: "watching", status: "unconfirmed" as const };
  const confirmed = { ...mockReport, id: "confirmed" };
  const mixed = { ...choice("rerouted", 3), hazards: [unconfirmed, confirmed] };

  assert.equal(reportForChoice(mixed, "wheelchair")?.id, confirmed.id);
});
