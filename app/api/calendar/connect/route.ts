import { NextResponse } from "next/server";

import {
  CALENDAR_OAUTH_STATE_COOKIE,
  CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS,
  createCalendarOAuthState,
  createGoogleAuthorizationUrl,
  getVerifiedMoWayUser,
  verifyRequestOrigin,
} from "@/lib/calendar/server";

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json(
        { error: "Calendar connection request was not allowed." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const user = await getVerifiedMoWayUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to MoWay before connecting Google Calendar." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (user.is_anonymous) {
      return NextResponse.json(
        { error: "Create or sign into a MoWay account before connecting Google Calendar." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { state, cookieValue } = createCalendarOAuthState(user.id);
    const response = NextResponse.json(
      { authorizationUrl: createGoogleAuthorizationUrl(state) },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(CALENDAR_OAUTH_STATE_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/calendar/callback",
      maxAge: CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Calendar connect route failed:", error);
    return NextResponse.json(
      { error: "Google Calendar is not set up on this server yet." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}