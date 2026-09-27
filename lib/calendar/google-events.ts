import "server-only";

import { CAMPUS_BUILDINGS, findBuildingByLabel } from "@/lib/maps/campus-buildings";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  decryptCalendarRefreshToken,
  getCalendarConnectionsAdmin,
  refreshGoogleCalendarAccessToken,
} from "@/lib/calendar/server";

type GoogleDateTime = {
  readonly date?: string;
  readonly dateTime?: string;
  readonly timeZone?: string;
};

type GoogleEvent = {
  readonly id?: string;
  readonly summary?: string;
  readonly status?: string;
  readonly start?: GoogleDateTime;
  readonly end?: GoogleDateTime;
  readonly location?: string;
  readonly colorId?: string;
};

// Google's 11 event colors (colorId "1".."11") are fairly saturated, so each maps to the
// closest pastel token in our own palette instead of Google's real (non-pastel) hex value.
const GOOGLE_EVENT_COLORS: Record<string, string> = {
  "1": "bg-lilac", // Lavender
  "2": "bg-mint", // Sage
  "3": "bg-lilac", // Grape
  "4": "bg-rose", // Flamingo
  "5": "bg-sun", // Banana
  "6": "bg-coral", // Tangerine
  "7": "bg-aqua", // Peacock
  "8": "bg-sand", // Graphite
  "9": "bg-aqua", // Blueberry
  "10": "bg-mint", // Basil
  "11": "bg-rose", // Tomato
};

type GoogleEventsResponse = {
  readonly items?: readonly GoogleEvent[];
  readonly nextPageToken?: string;
};

export type PrimaryCalendarResult =
  | {
      readonly connected: false;
      readonly reconnectRequired: false;
      readonly events: readonly [];
    }
  | {
      readonly connected: true;
      readonly reconnectRequired: true;
      readonly reason: "authorization_revoked";
      readonly events: readonly [];
    }
  | {
      readonly connected: true;
      readonly reconnectRequired: false;
      readonly events: CalendarEvent[];
    };

function localDateAndTime(
  dateTime: string,
  timeZone: string,
): { readonly date: string; readonly time: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(dateTime));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function normalizedLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function recognizedLocation(location: string | undefined): {
  readonly building?: string;
  readonly room?: string;
} {
  if (!location?.trim()) {
    return {};
  }

  let query = location.trim();
  let room: string | undefined;
  const describedRoom = query.match(
    /\b(?:room|rm\.?|suite)\s*#?\s*([A-Za-z]?\d+[A-Za-z]?)\b|#\s*([A-Za-z]?\d+[A-Za-z]?)\b/i,
  );
  if (describedRoom) {
    room = describedRoom[1] ?? describedRoom[2];
    query = query.replace(describedRoom[0], " ");
  } else {
    const codeAndRoom = query.match(/\b([A-Z]{2,5})\s+(\d{2,5}[A-Z]?)\b/);
    const codeBuilding = codeAndRoom ? findBuildingByLabel(codeAndRoom[1]) : undefined;
    if (codeAndRoom && codeBuilding) {
      room = codeAndRoom[2];
      query = query.replace(codeAndRoom[0], codeAndRoom[1]);
    }
  }

  const exactBuilding = findBuildingByLabel(query.trim());
  if (exactBuilding) {
    return { building: exactBuilding.code, ...(room ? { room } : {}) };
  }

  const normalizedQuery = ` ${normalizedLabel(query)} `;
  const knownLabels = CAMPUS_BUILDINGS.flatMap((building) => [
    building.name,
    building.code,
    building.id,
    ...(building.aliases ?? []),
  ]).sort((left, right) => right.length - left.length);
  const matchingLabel = knownLabels.find((label) => {
    const normalized = normalizedLabel(label);
    return normalized !== "" && normalizedQuery.includes(` ${normalized} `);
  });
  const building = matchingLabel ? findBuildingByLabel(matchingLabel) : undefined;
  return {
    ...(building ? { building: building.code } : {}),
    ...(room ? { room } : {}),
  };
}

function normalizeGoogleEvent(
  event: GoogleEvent,
  timeZone: string,
): CalendarEvent | null {
  if (!event.id || event.status === "cancelled" || !event.start || !event.end) {
    return null;
  }

  const title = event.summary?.trim() || "Untitled event";
  const location = event.location?.trim() || undefined;
  const place = recognizedLocation(location);
  const color = event.colorId ? GOOGLE_EVENT_COLORS[event.colorId] : undefined;
  if (event.start.date && event.end.date) {
    return {
      id: `google:${event.id}`,
      source: "google",
      title,
      date: event.start.date,
      allDay: true,
      endDate: event.end.date,
      ...(location ? { location } : {}),
      ...(color ? { color } : {}),
      ...place,
    };
  }

  if (!event.start.dateTime || !event.end.dateTime) {
    return null;
  }

  const start = localDateAndTime(event.start.dateTime, timeZone);
  const end = localDateAndTime(event.end.dateTime, timeZone);
  return {
    id: `google:${event.id}`,
    source: "google",
    title,
    date: start.date,
    allDay: false,
    start: start.time,
    end: end.time,
    ...(location ? { location } : {}),
    ...(color ? { color } : {}),
    ...place,
  };
}

export async function getPrimaryCalendarEvents(
  userId: string,
  timeMin: string,
  timeMax: string,
  timeZone: string,
): Promise<PrimaryCalendarResult> {
  const admin = getCalendarConnectionsAdmin();
  const { data: connection, error: connectionError } = await admin
    .from("calendar_connections")
    .select("refresh_token_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (connectionError) {
    throw new Error("Could not load Google Calendar connection.");
  }
  if (!connection?.refresh_token_encrypted) {
    return { connected: false, reconnectRequired: false, events: [] };
  }

  const refreshToken = decryptCalendarRefreshToken(connection.refresh_token_encrypted);
  const refreshed = await refreshGoogleCalendarAccessToken(refreshToken);
  if (refreshed.kind === "reconnect") {
    return {
      connected: true,
      reconnectRequired: true,
      reason: "authorization_revoked",
      events: [],
    };
  }

  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;
  do {
    const parameters = new URLSearchParams({
      timeMin,
      timeMax,
      timeZone,
      singleEvents: "true",
      orderBy: "startTime",
      showDeleted: "false",
      maxResults: "2500",
      fields: "items(id,summary,status,start(date,dateTime,timeZone),end(date,dateTime,timeZone),location,colorId),nextPageToken",
    });
    if (pageToken) {
      parameters.set("pageToken", pageToken);
    }

    let response: Response;
    try {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${parameters}`,
        {
          headers: { Authorization: `Bearer ${refreshed.accessToken}` },
          cache: "no-store",
        },
      );
    } catch {
      throw new Error("Could not reach Google Calendar. Please try again.");
    }

    if (response.status === 401) {
      return {
        connected: true,
        reconnectRequired: true,
        reason: "authorization_revoked",
        events: [],
      };
    }
    if (!response.ok) {
      throw new Error("Could not load Google Calendar events.");
    }

    let page: GoogleEventsResponse;
    try {
      page = (await response.json()) as GoogleEventsResponse;
    } catch {
      throw new Error("Google Calendar returned an unreadable response.");
    }
    for (const event of page.items ?? []) {
      const normalized = normalizeGoogleEvent(event, timeZone);
      if (normalized) {
        events.push(normalized);
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  return { connected: true, reconnectRequired: false, events };
}