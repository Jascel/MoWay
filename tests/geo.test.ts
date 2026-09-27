import assert from "node:assert/strict";
import { test } from "node:test";
import * as geo from "@/lib/maps/geo";

const degreesPerMeter = 180 / (Math.PI * 6_371_008.8);
const path = [{ lat: 0, lng: 0 }, { lat: 0, lng: 100 * degreesPerMeter }];

test("measures segment interior at the 25-meter boundary", () => {
  const point = { lat: 25 * degreesPerMeter, lng: 50 * degreesPerMeter };
  const distance = geo.distanceToPathMeters(point, path);
  assert.ok(Math.abs(distance - 25) < 1e-8);
});

test("clamps the projection beyond a path endpoint", () => {
  const distance = geo.distanceToPathMeters({ lat: 0, lng: -10 * degreesPerMeter }, path);
  assert.ok(Math.abs(distance - 10) < 1e-8);
});

test("handles empty paths, singleton paths and repeated vertices", () => {
  const point = { lat: 0, lng: 0 };
  assert.equal(geo.distanceToPathMeters(point, []), Infinity);
  assert.equal(geo.distanceToPathMeters(point, [point]), 0);
  assert.equal(geo.distanceToPathMeters(point, [point, point]), 0);
});
