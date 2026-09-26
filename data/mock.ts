// MoWay data contract (MOCK). Shapes here = what the real APIs should return.
// Times are "HH:MM" 24h strings, durations are minutes.

export type Mode = "walk" | "wheelchair" | "scooter" | "bike" | "drive_walk";

export type AccessPref =
  | "avoid_stairs"
  | "minimize_walking"
  | "paved_paths"
  | "well_lit"
  | "shaded";

export type ReportCategory =
  | "construction"
  | "sidewalk_closed"
  | "accessibility_barrier"
  | "flooding"
  | "poor_lighting"
  | "event_reroute"
  | "other";

// A user can pick several modes (e.g. drives in, then wheelchair on campus).
export interface Profile {
  name: string;
  modes: Mode[];
  prefs: AccessPref[];
  parkingBufferMinutes: number; // arrive this many min before first class so parking isn't stressful
}

// Drives the card color (see lib/categories.ts).
export type EventCategory = "class" | "meeting" | "club" | "fitness" | "event" | "work";

export interface ClassEvent {
  id: string;
  category: EventCategory;
  title: string; // "COP 3514 Intro to Program Design"
  building: string; // "ENB"
  room?: string;
  start: string;
  end: string;
}

// An event the user added through the Add form (stored in localStorage for now).
export interface SavedEvent extends ClassEvent {
  date: string; // "YYYY-MM-DD"
}

// Walking/rolling leg between two consecutive events.
export interface Leg {
  fromEventId: string | "parking" | "home";
  toEventId: string;
  mode?: "walk" | "drive"; // defaults to walk
  minutes: number;
  distanceMeters: number;
  tags: string[]; // route explanation chips: "More shaded", "+3 min", ...
}

export interface ParkingRecommendation {
  garage: string; // "Collins Garage"
  reason: string; // why it's best for the WHOLE day
  savesWalkMinutes: number; // total walking saved today vs. the default lot
  spotsLeftPercent: number; // 0-100 how full it is
  walkMinutesToFirstClass: number;
  walkMinutesFromLastClass: number;
}

export interface Weather {
  tempF: number;
  condition: "sunny" | "cloudy" | "rain" | "storm";
  rainChancePercent: number;
  stormAt?: string; // "HH:MM" when storms are expected
  summary: string;
}

export interface Report {
  id: string;
  category: ReportCategory;
  location: string;
  note?: string;
  minutesAgo: number;
  confirmations: number; // how many people said "still there"
  affectsRoute: boolean;
}

export interface DayPlan {
  date: string;
  leaveBy: string;
  leaveByReason: string; // "Traffic on I-275 adds 8 min"
  driveMinutes: number;
  arriveBy: string; // when you get to campus, e.g. 9:06 (before parking gets hard)
  weather: Weather;
  parking: ParkingRecommendation;
  events: ClassEvent[];
  legs: Leg[];
  alert: { reportId: string; message: string; extraMinutes: number } | null;
}

export const mockProfile: Profile = {
  name: "Connie",
  modes: ["drive_walk", "wheelchair"],
  prefs: ["avoid_stairs", "paved_paths"],
  parkingBufferMinutes: 24,
};

export const mockReport: Report = {
  id: "r1",
  category: "accessibility_barrier",
  location: "Ramp by the Marshall Student Center",
  note: "Ramp blocked by construction fencing",
  minutesAgo: 12,
  confirmations: 2,
  affectsRoute: true,
};

export const mockDay: DayPlan = {
  date: "2026-10-01",
  leaveBy: "08:40",
  leaveByReason: "Leaving by 8:40 gets you a spot before the lot fills up",
  driveMinutes: 26,
  arriveBy: "09:06",
  weather: {
    tempF: 91,
    condition: "storm",
    rainChancePercent: 70,
    stormAt: "14:30",
    summary: "Storms this afternoon. Bring an umbrella.",
  },
  parking: {
    garage: "Zimmerman (outside CIS)",
    reason: "Right next to CIS, where your first three stops are. Move your car to ENB before your lab.",
    savesWalkMinutes: 19,
    spotsLeftPercent: 34,
    walkMinutesToFirstClass: 4,
    walkMinutesFromLastClass: 4,
  },
  events: [
    { id: "e1", category: "class", title: "MAC 2312", building: "CIS", room: "1045", start: "09:30", end: "10:45" },
    { id: "e2", category: "meeting", title: "Logistics meeting", building: "CIS", start: "11:00", end: "11:15" },
    { id: "e3", category: "class", title: "CDA 3201", building: "CWY", room: "107", start: "12:30", end: "13:45" },
    { id: "e4", category: "club", title: "MentorSHPE Meeting", building: "USF Library", start: "14:00", end: "15:00" },
    { id: "e5", category: "fitness", title: "Pilates", building: "USF Recreation Center", start: "16:30", end: "17:30" },
    { id: "e6", category: "class", title: "CDA 3201L", building: "ENB", room: "214", start: "18:00", end: "19:45" },
  ],
  legs: [
    { fromEventId: "parking", toEventId: "e1", minutes: 4, distanceMeters: 300, tags: ["Paved", "Step-free"] },
    { fromEventId: "e1", toEventId: "e2", minutes: 1, distanceMeters: 40, tags: ["Same building"] },
    { fromEventId: "e2", toEventId: "e3", minutes: 8, distanceMeters: 560, tags: ["+3 min", "Avoids construction"] },
    { fromEventId: "e3", toEventId: "e4", minutes: 7, distanceMeters: 480, tags: ["More shaded"] },
    { fromEventId: "e4", toEventId: "e5", minutes: 10, distanceMeters: 750, tags: ["Step-free"] },
    { fromEventId: "e5", toEventId: "e6", mode: "drive", minutes: 20, distanceMeters: 2500, tags: ["Move your car to ENB"] },
  ],
  alert: {
    reportId: "r1",
    message: "Ramp near the Marshall Student Center is blocked. Your walk to CDA 3201 now takes 3 min longer.",
    extraMinutes: 3,
  },
};
