import { getSupabaseClient } from "@/lib/supabase/client";
import { isNearCampus } from "@/lib/campus";

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

  // Reports must be within the USF Tampa campus area.
  if (!isNearCampus(input.latitude, input.longitude)) {
    throw new Error(
      "Report location must be within the USF Tampa campus area."
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

    expiresAt = expiration.toISOString();
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      report_type: input.reportType,
      impact: input.impact,
      condition_class:
        input.conditionClass,
      latitude: input.latitude,
      longitude: input.longitude,
      location_name:
        input.locationName?.trim() || null,
      note:
        input.note?.trim() || null,
      status: "unconfirmed",
      expires_at: expiresAt,
      confidence_score: 50,
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

  // Store this user's confirmation.
  // The database trigger handles confidence scoring.
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
    // PostgreSQL unique-constraint error:
    // this user already confirmed this report.
    if (
      confirmationError.code === "23505"
    ) {
      throw new Error(
        "You have already confirmed this report."
      );
    }

    throw confirmationError;
  }

  // A YES confirmation refreshes temporary reports
  // for another 24 hours.
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

    if (
      report.condition_class ===
      "temporary"
    ) {
      const expiration = new Date();

      expiration.setHours(
        expiration.getHours() + 24
      );

      const { error: updateError } =
        await supabase
          .from("reports")
          .update({
            expires_at:
              expiration.toISOString(),
          })
          .eq("id", reportId);

      if (updateError) {
        throw updateError;
      }
    }
  }

  return confirmation;
}

// --------------------
// GET ACTIVE REPORTS
// --------------------

export async function getActiveReports() {
  const supabase = getSupabaseClient();

  const {
    data: reports,
    error,
  } = await supabase
    .from("active_reports")
    .select(`
      *,
      report_confirmations (
        still_there
      )
    `)
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
        report.report_confirmations ?? [];

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
          report.location_name ?? null,

        note:
          report.note ?? null,

        confirmation_count:
          confirmationCount,

        // Hide nested confirmation rows
        // from the frontend result.
        report_confirmations:
          undefined,
      };
    }
  );
}

// --------------------
// GET NEARBY REPORTS
// --------------------

export async function getNearbyReports(
  latitude: number,
  longitude: number,
  radiusMeters = 500
) {
  // Validate the requested location.
  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Invalid location."
    );
  }

  if (radiusMeters <= 0) {
    throw new Error(
      "Radius must be greater than zero."
    );
  }

  // getActiveReports already removes:
  // - expired reports
  // - resolved reports
  // - reports with low effective confidence
  const reports =
    await getActiveReports();

  return reports
    .map((report) => {
      const distance =
        distanceInMeters(
          latitude,
          longitude,
          report.latitude,
          report.longitude
        );

      return {
        ...report,
        distance_meters:
          Math.round(distance),
      };
    })
    .filter(
      (report) =>
        report.distance_meters <=
        radiusMeters
    )
    .sort(
      (a, b) =>
        a.distance_meters -
        b.distance_meters
    );
}

// --------------------
// RESOLVE REPORT
// --------------------

export async function resolveReport(
  reportId: string
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
      "You must be logged in to resolve a report."
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
    })
.eq("id", reportId)
.eq("reporter_id", user.id)
.select();
  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Report was not found or does not belong to this user."
    );
  }

  return data[0];
}

// --------------------
// RESOLVE MY REPORTS
// --------------------

export async function resolveMyReports() {
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
      "You must be logged in to clear your reports."
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
    })
.eq("reporter_id", user.id)
.in("status", [
  "unconfirmed",
  "confirmed",
])
.select();

  if (error) {
    throw error;
  }

  return data ?? [];
}