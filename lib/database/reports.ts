import { getSupabaseClient } from "@/lib/supabase/client";

// --------------------
// REPORT TYPES
// --------------------

export type ReportType =
  | "construction"
  | "sidewalk_ends"
  | "blocked_sidewalk"
  | "flooding"
  | "accessible_entrance_closed"
  | "poor_lighting"
  | "other";

export type ReportImpact =
  | "inconvenience"
  | "blocks_walking"
  | "blocks_scooter"
  | "blocks_wheelchair"
  | "blocks_all";

export type ConditionClass =
  | "temporary"
  | "infrastructure";

export type ReportInput = {
  reportType: ReportType;
  impact: ReportImpact;
  conditionClass: ConditionClass;

  // Location of the reported problem
  latitude: number;
  longitude: number;

  // User's current location
  userLatitude: number;
  userLongitude: number;

  // Optional information shown in the UI
  locationName?: string;
  note?: string;
};

// --------------------
// DISTANCE
// --------------------

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371000;

  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

// --------------------
// CREATE REPORT
// --------------------

export async function createReport(
  input: ReportInput
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to submit a report."
    );
  }

  // Validate reported location
  if (
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new Error(
      "Invalid report location."
    );
  }

  // Validate user's current location
  if (
    input.userLatitude < -90 ||
    input.userLatitude > 90 ||
    input.userLongitude < -180 ||
    input.userLongitude > 180
  ) {
    throw new Error(
      "Invalid user location."
    );
  }

  // Calculate distance from user to reported problem
  const distance = distanceInMeters(
    input.userLatitude,
    input.userLongitude,
    input.latitude,
    input.longitude
  );

  // Construction can be reported from farther away
  const allowedDistance =
    input.reportType === "construction"
      ? 300
      : 50;

  if (distance > allowedDistance) {
    throw new Error(
      `You must be within ${allowedDistance} meters of the reported location.`
    );
  }

  // Temporary conditions expire after 24 hours.
  // Infrastructure conditions stay until resolved.
  let expiresAt: string | null = null;

  if (
    input.conditionClass === "temporary"
  ) {
    const expiration = new Date();

    expiration.setHours(
      expiration.getHours() + 24
    );

    expiresAt =
      expiration.toISOString();
  }

  const { data, error } =
    await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        report_type:
          input.reportType,
        impact: input.impact,
        condition_class:
          input.conditionClass,
        latitude: input.latitude,
        longitude: input.longitude,
        location_name:
          input.locationName?.trim() ||
          null,
        note:
          input.note?.trim() || null,
        status: "unconfirmed",
        expires_at: expiresAt,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}

// --------------------
// CONFIRM REPORT
// --------------------

export async function confirmReport(
  reportId: string,
  stillThere: boolean
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to confirm a report."
    );
  }

  // Store this user's confirmation
  const {
    data: confirmation,
    error: confirmationError,
  } = await supabase
    .from("report_confirmations")
    .insert({
      report_id: reportId,
      user_id: user.id,
      still_there: stillThere,
    })
    .select()
    .single();

  if (confirmationError) {
    // PostgreSQL unique-constraint error
    if (
      confirmationError.code === "23505"
    ) {
      throw new Error(
        "You have already confirmed this report."
      );
    }

    throw confirmationError;
  }

  // If the user says the problem is still there,
  // confirm the report.
  if (stillThere) {
    const {
      data: report,
      error: reportError,
    } = await supabase
      .from("reports")
      .select("condition_class")
      .eq("id", reportId)
      .single();

    if (reportError) {
      throw reportError;
    }

    let newExpiration:
      | string
      | null = null;

    // A confirmation refreshes temporary reports
    // for another 24 hours.
    if (
      report.condition_class ===
      "temporary"
    ) {
      const expiration =
        new Date();

      expiration.setHours(
        expiration.getHours() + 24
      );

      newExpiration =
        expiration.toISOString();
    }

    const updateData: {
      status: string;
      expires_at?: string;
    } = {
      status: "confirmed",
    };

    // Infrastructure reports keep expires_at = NULL.
    if (newExpiration) {
      updateData.expires_at =
        newExpiration;
    }

    const { error: updateError } =
      await supabase
        .from("reports")
        .update(updateData)
        .eq("id", reportId);

    if (updateError) {
      throw updateError;
    }
  }

  return confirmation;
}

// --------------------
// GET ACTIVE REPORTS
// --------------------

export async function getActiveReports() {
  const supabase =
    getSupabaseClient();

  const now =
    new Date().toISOString();

  const {
    data: reports,
    error,
  } = await supabase
    .from("reports")
    .select(`
      *,
      report_confirmations (
        still_there
      )
    `)
    .or(
      `expires_at.is.null,expires_at.gt.${now}`
    )
    .in("status", [
      "unconfirmed",
      "confirmed",
    ])
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  // Add confirmation count for the frontend.
  return (reports ?? []).map(
    (report) => {
      const confirmations =
        report.report_confirmations ??
        [];

      const confirmationCount =
        confirmations.filter(
          (confirmation: {
            still_there: boolean;
          }) =>
            confirmation.still_there ===
            true
        ).length;

      return {
        ...report,

        location_name:
          report.location_name ??
          null,

        note:
          report.note ?? null,

        confirmation_count:
          confirmationCount,

        // Hide the nested rows from the UI.
        report_confirmations:
          undefined,
      };
    }
  );
}