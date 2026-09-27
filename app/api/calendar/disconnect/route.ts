import { NextResponse } from "next/server";

import {
  decryptCalendarRefreshToken,
  getCalendarConnectionsAdmin,
  getVerifiedMoWayUser,
  revokeGoogleAuthorization,
  verifyRequestOrigin,
} from "@/lib/calendar/server";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Calendar disconnect request was not allowed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = await getVerifiedMoWayUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Your MoWay session has expired. Sign in again." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (user.is_anonymous) {
    return NextResponse.json(
      { error: "Sign in to a MoWay account to manage Calendar connections." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const admin = getCalendarConnectionsAdmin();
  const { data: connection, error: lookupError } = await admin
    .from("calendar_connections")
    .select("refresh_token_encrypted")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: "Could not disconnect Google Calendar. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  let googleRevoked = false;
  if (connection?.refresh_token_encrypted) {
    try {
      await revokeGoogleAuthorization(
        decryptCalendarRefreshToken(connection.refresh_token_encrypted),
      );
      googleRevoked = true;
    } catch {
      // Removing the local connection remains authoritative if Google is unavailable.
    }
  }

  const { error: deleteError } = await admin
    .from("calendar_connections")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Could not remove the saved Calendar connection. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { connected: false, googleRevoked },
    { headers: { "Cache-Control": "no-store" } },
  );
}