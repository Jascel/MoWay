import { NextResponse } from "next/server";

import {
  getCalendarConnectionsAdmin,
  getVerifiedMoWayUser,
} from "@/lib/calendar/server";

export async function GET(request: Request) {
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
}