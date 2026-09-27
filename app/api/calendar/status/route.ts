import { NextResponse } from "next/server";

import {
  getCalendarConnectionsAdmin,
  getVerifiedMoWayUser,
} from "@/lib/calendar/server";

export async function GET(request: Request) {
  try {
    const user = await getVerifiedMoWayUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Your MoWay session has expired. Sign in again." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (user.is_anonymous) {
      return NextResponse.json(
        { connected: false, isAnonymous: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const { data, error } = await getCalendarConnectionsAdmin()
      .from("calendar_connections")
      .select("connected_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Could not check Google Calendar connection status." },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        connected: data !== null,
        connectedAt: data?.connected_at ?? null,
        isAnonymous: false,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // A missing server env var (or any other setup problem) lands here. Without this,
    // the route crashes before sending a body, and the browser sees an empty response.
    console.error("Calendar status route failed:", error);
    return NextResponse.json(
      { error: "Google Calendar is not set up on this server yet." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}