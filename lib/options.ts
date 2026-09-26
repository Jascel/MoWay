import type { LucideIcon } from "lucide-react";
import { Accessibility, Bike, Car, Footprints, Layers, Lightbulb, Route, Scooter, Timer, TreePine } from "lucide-react";
import type { AccessPref, Mode } from "@/data/mock";

// Labels + icons shown on the Profile screen. `value` matches the types in data/mock.ts.
export const modeOptions: { value: Mode; label: string; icon: LucideIcon }[] = [
  { value: "walk", label: "Walking", icon: Footprints },
  { value: "wheelchair", label: "Wheelchair", icon: Accessibility },
  { value: "scooter", label: "Scooter", icon: Scooter },
  { value: "bike", label: "Bike", icon: Bike },
  { value: "drive_walk", label: "Drive + walk", icon: Car },
];

export const prefOptions: { value: AccessPref; label: string; icon: LucideIcon }[] = [
  { value: "avoid_stairs", label: "Avoid stairs", icon: Layers },
  { value: "minimize_walking", label: "Minimize walking", icon: Timer },
  { value: "paved_paths", label: "Paved paths", icon: Route },
  { value: "well_lit", label: "Well-lit routes", icon: Lightbulb },
  { value: "shaded", label: "Shaded routes", icon: TreePine },
];
