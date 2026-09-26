import type { LucideIcon } from "lucide-react";
import {
  Accessibility, Bike, Bus, Car, DoorOpen, Footprints, Layers, Lightbulb,
  Route, Scooter, Timer, TreePine, Umbrella, Users,
} from "lucide-react";
import type { AccessPref, Mode } from "@/data/mock";
import type { CampusMode } from "@/lib/profileMode";

// Bump the number if the saved profile shape changes, so old saved data is ignored.
export const PROFILE_KEY = "moway.profile.v2";

// Labels + icons shown on the Profile screen. `value` matches the types in data/mock.ts.
export const modeOptions: { value: Mode; label: string; icon: LucideIcon }[] = [
  { value: "walking", label: "Walking", icon: Footprints },
  { value: "wheelchair", label: "Wheelchair", icon: Accessibility },
  { value: "scooter", label: "Scooter", icon: Scooter },
  { value: "bike", label: "Bike", icon: Bike },
  { value: "driving", label: "Driving", icon: Car },
  { value: "transit", label: "Transit", icon: Bus },
];

/** Same icons as Profile → "Using today", for on-campus legs and Smart Park. */
export const campusTravelIcons: Record<CampusMode, LucideIcon> = {
  walking: Footprints,
  wheelchair: Accessibility,
  scooter: Scooter,
  bike: Bike,
};

/** Same icon as Profile → "Using today". Falls back to footprints if unknown. */
export function modeIcon(mode: Mode): LucideIcon {
  return modeOptions.find((option) => option.value === mode)?.icon ?? Footprints;
}

export const prefOptions: { value: AccessPref; label: string; icon: LucideIcon }[] = [
  { value: "step_free", label: "Step-free routes", icon: Layers },
  { value: "paved_surface", label: "Paved surfaces", icon: Route },
  { value: "accessible_entrances", label: "Accessible entrances", icon: DoorOpen },
  { value: "willing_extra_distance", label: "OK with a longer route", icon: Timer },
  { value: "prefer_shade", label: "Prefer shade", icon: TreePine },
  { value: "prefer_covered", label: "Prefer covered walkways", icon: Umbrella },
  { value: "avoid_crowds", label: "Avoid crowds", icon: Users },
  { value: "well_lit", label: "Well-lit routes", icon: Lightbulb },
];
