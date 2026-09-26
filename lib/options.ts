import type { AccessPref, Mode } from "@/data/mock";

// Labels shown on the Profile screen. `value` matches the types in data/mock.ts.
export const modeOptions: { value: Mode; label: string; icon: string }[] = [
  { value: "walk", label: "Walking", icon: "🚶" },
  { value: "wheelchair", label: "Wheelchair", icon: "♿" },
  { value: "scooter", label: "Scooter", icon: "🛴" },
  { value: "bike", label: "Bike", icon: "🚲" },
  { value: "drive_walk", label: "Drive + walk", icon: "🚗" },
];

export const prefOptions: { value: AccessPref; label: string; icon: string }[] = [
  { value: "avoid_stairs", label: "Avoid stairs", icon: "🪜" },
  { value: "minimize_walking", label: "Minimize walking", icon: "🦶" },
  { value: "paved_paths", label: "Paved paths", icon: "🛣️" },
  { value: "well_lit", label: "Well-lit routes", icon: "💡" },
  { value: "shaded", label: "Shaded routes", icon: "🌳" },
];
