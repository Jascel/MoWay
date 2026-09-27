import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createClient, type User } from "@supabase/supabase-js";

export const CALENDAR_OAUTH_STATE_COOKIE = "moway_calendar_oauth_state";
export const CALENDAR_READ_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.readonly";
export const CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS = 600;

type CalendarOAuthState = {
  readonly state: string;
  readonly userId: string;
  readonly expiresAt: number;
};

export type GoogleTokenResponse = {
  readonly access_token?: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
  readonly scope?: string;
  readonly token_type?: string;
  readonly error?: string;
  readonly error_description?: string;
};

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Server configuration is missing ${name}.`);
  }
  return value;
}

export function getAppBaseUrl(): string {
  const baseUrl = new URL(requiredEnvironmentVariable("APP_BASE_URL"));
  if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("APP_BASE_URL must contain only the application origin.");
  }
  if (
    baseUrl.protocol !== "https:" &&
    !(baseUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(baseUrl.hostname))
  ) {
    throw new Error("APP_BASE_URL must use HTTPS outside local development.");
  }
  return baseUrl.origin;
}

export function verifyRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  try {
    return new URL(origin).origin === getAppBaseUrl();
  } catch {
    return false;
  }
}

export async function getVerifiedMoWayUser(
  request: Request,
): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const supabase = createClient(
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error) {
    return null;
  }
  return data.user;
}

export function getCalendarConnectionsAdmin() {
  return createClient(
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

function stateSigningSecret(): Buffer {
  const secret = Buffer.from(
    requiredEnvironmentVariable("CALENDAR_OAUTH_STATE_SECRET"),
    "base64",
  );
  if (secret.length < 32) {
    throw new Error("CALENDAR_OAUTH_STATE_SECRET must decode to at least 32 bytes.");
  }
  return secret;
}

export function createCalendarOAuthState(userId: string): {
  readonly state: string;
  readonly cookieValue: string;
} {
  const claims: CalendarOAuthState = {
    state: randomBytes(32).toString("base64url"),
    userId,
    expiresAt: Date.now() + CALENDAR_OAUTH_STATE_MAX_AGE_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", stateSigningSecret())
    .update(payload)
    .digest("base64url");
  return { state: claims.state, cookieValue: `${payload}.${signature}` };
}

export function verifyCalendarOAuthState(
  cookieValue: string | undefined,
  returnedState: string | null,
): CalendarOAuthState | null {
  if (!cookieValue || !returnedState) {
    return null;
  }
  const [payload, encodedSignature, ...extra] = cookieValue.split(".");
  if (!payload || !encodedSignature || extra.length > 0) {
    return null;
  }

  const expectedSignature = createHmac("sha256", stateSigningSecret())
    .update(payload)
    .digest();
  const actualSignature = Buffer.from(encodedSignature, "base64url");
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as CalendarOAuthState;
    if (
      claims.expiresAt <= Date.now() ||
      claims.state !== returnedState ||
      typeof claims.userId !== "string"
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function googleCalendarRedirectUri(): string {
  return `${getAppBaseUrl()}/api/calendar/callback`;
}

export function createGoogleAuthorizationUrl(state: string): string {
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: requiredEnvironmentVariable("NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID"),
    redirect_uri: googleCalendarRedirectUri(),
    response_type: "code",
    scope: CALENDAR_READ_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  return authorizationUrl.toString();
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requiredEnvironmentVariable("NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID"),
      client_secret: requiredEnvironmentVariable("GOOGLE_CALENDAR_CLIENT_SECRET"),
      redirect_uri: googleCalendarRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as GoogleTokenResponse;
  if (!response.ok) {
    throw new Error(result.error_description || "Google authorization could not be completed.");
  }
  return result;
}

export async function refreshGoogleCalendarAccessToken(
  refreshToken: string,
): Promise<
  | { readonly kind: "success"; readonly accessToken: string }
  | { readonly kind: "reconnect" }
> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requiredEnvironmentVariable("NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID"),
      client_secret: requiredEnvironmentVariable("GOOGLE_CALENDAR_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  let result: GoogleTokenResponse;
  try {
    result = (await response.json()) as GoogleTokenResponse;
  } catch {
    throw new Error("Google Calendar token refresh failed.");
  }

  if (result.error === "invalid_grant") {
    return { kind: "reconnect" };
  }
  if (!response.ok || !result.access_token) {
    throw new Error("Google Calendar token refresh failed.");
  }

  return { kind: "success", accessToken: result.access_token };
}

function tokenEncryptionKey(): Buffer {
  const key = Buffer.from(
    requiredEnvironmentVariable("CALENDAR_TOKEN_ENCRYPTION_KEY"),
    "base64",
  );
  if (key.length !== 32) {
    throw new Error("CALENDAR_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

export function encryptCalendarRefreshToken(refreshToken: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptCalendarRefreshToken(encryptedToken: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...extra] =
    encryptedToken.split(".");
  if (version !== "v1" || !encodedIv || !encodedTag || !encodedCiphertext || extra.length > 0) {
    throw new Error("Stored Google Calendar credentials are invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    tokenEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function revokeGoogleAuthorization(refreshToken: string): Promise<void> {
  const response = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Google authorization revocation failed.");
  }
}