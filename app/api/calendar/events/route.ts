import { NextResponse } from "next/server";

import { getPrimaryCalendarEvents } from "@/lib/calendar/google-events";
import { getVerifiedMoWayUser } from "@/lib/calendar/server";

const MAX_RANGE_MILLISECONDS = 43 * 24 * 60 * 60 * 1000;

function validRfc3339Instant(value: string | null): value is string {
  return value !== null &&
    /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value) &&
    Number.isFinite(Date.parse(value));
}

function isValidTimeZone(value: string | null): value is string {
  if (!value) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const user = await getVerifiedMoWayUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Your MoWay session has expired. Sign in again." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parameters = new URL(request.url).searchParams;
  const timeMin = parameters.get("timeMin");
  const timeMax = parameters.get("timeMax");
  const timeZone = parameters.get("timeZone");
  if (
    !validRfc3339Instant(timeMin) ||
    !validRfc3339Instant(timeMax) ||
    Date.parse(timeMin) >= Date.parse(timeMax) ||
    Date.parse(timeMax) - Date.parse(timeMin) > MAX_RANGE_MILLISECONDS ||
    !isValidTimeZone(timeZone)
  ) {
    return NextResponse.json(
      { error: "Calendar date range or timezone is invalid." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (user.is_anonymous) {
    return NextResponse.json(
      { events: [], connected: false, reconnectRequired: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await getPrimaryCalendarEvents(
      user.id,
      timeMin,
      timeMax,
      timeZone,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load Google Calendar events. Please try again." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}