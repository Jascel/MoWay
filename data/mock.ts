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
}

export interface ClassEvent {
  id: string;
  title: string; // "COP 3514 Intro to Program Design"
  building: string; // "ENB"
  room?: string;
  start: string;
  end: string;
}

// Walking/rolling leg between two consecutive events.
export interface Leg {
  fromEventId: string | "parking" | "home";
  toEventId: string;
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
  fasterThan: { time: string; minutes: number }; // "10 min faster than leaving at 08:00"
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
  date: "2026-09-25",
  leaveBy: "08:05",
  leaveByReason: "Traffic on I-275 adds 8 min",
  driveMinutes: 20,
  fasterThan: { time: "08:00", minutes: 10 },
  weather: {
    tempF: 91,
    condition: "storm",
    rainChancePercent: 70,
    stormAt: "14:30",
    summary: "Storms this afternoon. Bring an umbrella.",
  },
  parking: {
    garage: "Collins Garage",
    reason: "Closest to both your 9:30 and 2:15 classes",
    savesWalkMinutes: 19,
    spotsLeftPercent: 34,
    walkMinutesToFirstClass: 6,
    walkMinutesFromLastClass: 4,
  },
  events: [
    { id: "e1", title: "COP 3514 Program Design", building: "ENB", room: "118", start: "09:30", end: "10:45" },
    { id: "e2", title: "MAC 2311 Calculus I", building: "CMC", room: "130", start: "11:00", end: "12:15" },
    { id: "e3", title: "Study group", building: "Library", start: "13:00", end: "14:00" },
    { id: "e4", title: "PHY 2048 Physics", building: "CHE", room: "100", start: "14:15", end: "15:30" },
  ],
  legs: [
    { fromEventId: "parking", toEventId: "e1", minutes: 6, distanceMeters: 420, tags: ["Paved", "Step-free"] },
    { fromEventId: "e1", toEventId: "e2", minutes: 8, distanceMeters: 560, tags: ["+3 min", "Avoids construction"] },
    { fromEventId: "e2", toEventId: "e3", minutes: 5, distanceMeters: 340, tags: ["More shaded"] },
    { fromEventId: "e3", toEventId: "e4", minutes: 7, distanceMeters: 480, tags: ["Step-free"] },
  ],
  alert: {
    reportId: "r1",
    message: "Ramp near the Student Center is blocked. Your route to Calculus now takes 3 min longer.",
    extraMinutes: 3,
  },
};
