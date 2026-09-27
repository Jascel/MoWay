import assert from "node:assert/strict";
import { test } from "node:test";
import { mockProfile, type Profile } from "@/data/mock";
import type { CampusGarage, CampusPlace } from "@/lib/maps/types";
import { profileStartOrigin, profileUsesDriving } from "@/lib/profileMode";

const garage: CampusGarage = {
  id: "garage-a",
  name: "Garage A",
  position: { lat: 28.06, lng: -82.41 },
};

const home: CampusPlace = {
  id: "home-address:home-id",
  name: "Home",
  position: { lat: 28.05, lng: -82.42 },
};

test("detects driving when it is an available mode even if another mode is active", () => {
  const profile: Profile = { ...mockProfile, modes: ["driving", "wheelchair"], activeMode: "wheelchair" };
  assert.equal(profileUsesDriving(profile), true);
});

test("returns to non-driving behavior after driving is removed from the profile", () => {
  const drivingProfile: Profile = { ...mockProfile, modes: ["driving", "walking"] };
  const nonDrivingProfile: Profile = { ...drivingProfile, modes: ["walking"], activeMode: "walking" };

  assert.equal(profileUsesDriving(drivingProfile), true);
  assert.equal(profileUsesDriving(nonDrivingProfile), false);
});

test("uses the planned garage for a driving profile", () => {
  const profile: Profile = { ...mockProfile, modes: ["driving", "walking"] };
  assert.equal(profileStartOrigin(profile, garage, home), garage);
});

test("uses the saved home as a non-driving origin, even when a garage exists", () => {
  const profile: Profile = { ...mockProfile, modes: ["walking"], activeMode: "walking" };
  assert.equal(profileStartOrigin(profile, garage, home), home);
});

test("leaves the first route unavailable without a saved non-driving origin", () => {
  const profile: Profile = { ...mockProfile, modes: ["walking"], activeMode: "walking" };
  assert.equal(profileStartOrigin(profile, garage, undefined), undefined);
});

test("switching from driving to non-driving switches the origin source", () => {
  const drivingProfile: Profile = { ...mockProfile, modes: ["driving", "walking"] };
  const nonDrivingProfile: Profile = { ...mockProfile, modes: ["walking"], activeMode: "walking" };

  assert.equal(profileStartOrigin(drivingProfile, garage, home), garage);
  assert.equal(profileStartOrigin(nonDrivingProfile, garage, home), home);
});
