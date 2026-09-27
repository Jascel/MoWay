import { NextRequest, NextResponse } from "next/server";

import {
  CALENDAR_OAUTH_STATE_COOKIE,
  decryptCalendarRefreshToken,
  encryptCalendarRefreshToken,
  exchangeGoogleAuthorizationCode,
  getAppBaseUrl,
  getCalendarConnectionsAdmin,
  verifyCalendarOAuthState,
} from "@/lib/calendar/server";

function callbackRedirect(
  status: "connected" | "cancelled" | "error",
): NextResponse {
  const response = NextResponse.redirect(
    new URL(`/calendar?calendarConnection=${status}`, getAppBaseUrl()),
  );
  response.cookies.set(CALENDAR_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/calendar/callback",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const stateClaims = verifyCalendarOAuthState(
    request.cookies.get(CALENDAR_OAUTH_STATE_COOKIE)?.value,
    request.nextUrl.searchParams.get("state"),
  );
  if (!stateClaims) {
    return callbackRedirect("error");
  }

  if (request.nextUrl.searchParams.has("error")) {
    return callbackRedirect("cancelled");
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return callbackRedirect("error");
  }

  try {
    const tokenResponse = await exchangeGoogleAuthorizationCode(code);
    const admin = getCalendarConnectionsAdmin();
    const { data: existing, error: lookupError } = await admin
      .from("calendar_connections")
      .select("refresh_token_encrypted")
      .eq("user_id", stateClaims.userId)
      .maybeSingle();

    if (lookupError) {
      return callbackRedirect("error");
    }

    if (tokenResponse.refresh_token) {
      const encryptedRefreshToken = encryptCalendarRefreshToken(
        tokenResponse.refresh_token,
      );
      const { error: saveError } = await admin
        .from("calendar_connections")
        .upsert(
          {
            user_id: stateClaims.userId,
            refresh_token_encrypted: encryptedRefreshToken,
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (saveError) {
        return callbackRedirect("error");
      }
    } else if (existing?.refresh_token_encrypted) {
      // Google can omit refresh_token on subsequent grants. Keep the saved token.
      decryptCalendarRefreshToken(existing.refresh_token_encrypted);
    } else {
      return callbackRedirect("error");
    }

    return callbackRedirect("connected");
  } catch {
    return callbackRedirect("error");
  }
}