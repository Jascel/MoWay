import assert from "node:assert/strict";
import { test } from "node:test";
import { restoreMapSelection } from "@/lib/maps/map-persistence";

test("restores saved route places when they remain available", () => {
  // Given a saved selection whose places still exist.
  const saved = { originId: "home-start", destinationId: "CIS" };
  // When the map restores against current place choices.
  const selection = restoreMapSelection(saved, ["home-start", "ENB"], ["CIS", "ENB"], "ENB", "CIS");
  // Then both selected places survive restoration.
  assert.deepEqual(selection, saved);
});

test("replaces an unavailable saved garage with the configured start", () => {
  // Given a saved garage origin that is unavailable in this profile mode.
  const saved = { originId: "garage-a", destinationId: "missing" };
  // When the map restores against non-driving place choices.
  const selection = restoreMapSelection(saved, ["home-start", "ENB"], ["CIS", "ENB"], "home-start", "ENB");
  // Then it uses the configured non-driving start and current destination fallback.
  assert.deepEqual(selection, { originId: "home-start", destinationId: "ENB" });
});
