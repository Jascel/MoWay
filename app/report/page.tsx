"use client";

import { useEffect, useState } from "react";
import { Check, LocateFixed } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import StillThereCard from "@/components/StillThereCard";

import {
  categoryInfo,
  durationOptions,
  impactOptions,
  reportCategories,
  REPORTS_KEY,
} from "@/lib/reportCategories";

import { useStoredState } from "@/lib/useStoredState";

import {
  type ConditionClass,
  type Report,
  type ReportCategory,
  type ReportImpact,
  type RouteAlert,
} from "@/data/mock";

import {
  ALERT_KEY,
  alertFromReport,
} from "@/lib/alerts";

import {
  createReport,
  getActiveReports,
  resolveMyReports,
} from "@/lib/database/reports";

import { toReportInput } from "@/lib/backendMapping";
import { rowToReport } from "@/lib/database/mapReport";
import { isNearCampus } from "@/lib/campus";
import { subscribeToReports } from "@/lib/database/realtime";

type Coords = {
  latitude: number;
  longitude: number;
};

// Marshall Student Center for demo/testing
const DEMO_COORDS: Coords = {
  latitude: 28.063634,
  longitude: -82.413211,
};

export default function ReportPage() {
  const [myReports, saveMyReports] =
    useStoredState<Report[]>(REPORTS_KEY, []);

  const [, saveAlert] =
    useStoredState<RouteAlert | null>(
      ALERT_KEY,
      null
    );

  const [category, setCategory] =
    useState<ReportCategory | null>(null);

  const [impact, setImpact] =
    useState<ReportImpact | null>(null);

  const [duration, setDuration] =
    useState<ConditionClass>("temporary");

  const [coords, setCoords] =
    useState<Coords | null>(null);

  const [locStatus, setLocStatus] =
    useState("");

  const [locationName, setLocationName] =
    useState("");

  const [note, setNote] =
    useState("");

  const [error, setError] =
    useState("");

  const [sent, setSent] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);
  
    const [clearing, setClearing] =
  useState(false);

  const [nearbyReport, setNearbyReport] =
    useState<Report | null>(null);

  // --------------------
  // LOAD ACTIVE REPORTS
  // --------------------

  async function loadReports() {
    try {
      const reports = await getActiveReports();
      // "Near you" only lists reports near campus.
      const nearby = reports.filter((r) => isNearCampus(r.latitude, r.longitude));
      setNearbyReport(nearby.length > 0 ? rowToReport(nearby[0]) : null);
    } catch (err) {
      console.error("Could not load active reports:", err);
    }
  }

  useEffect(() => {
    // Run after the first render, so the state updates inside loadReports happen in a callback.
    const timer = setTimeout(loadReports, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update "Near you" live when anyone reports something or answers "Is it still there?".
  useEffect(() => subscribeToReports(loadReports), []);

  // --------------------
  // GET USER LOCATION
  // --------------------

  function findMyLocation() {
    setLocStatus("Finding you...");

    if (!navigator.geolocation) {
      setLocStatus(
        "Location isn't available on this device."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude:
            pos.coords.latitude,

          longitude:
            pos.coords.longitude,
        });

        setLocStatus(
          `Location found (within about ${Math.round(
            pos.coords.accuracy
          )} m)`
        );
      },

      () => {
        setLocStatus(
          "Couldn't get your location. Allow location access, or use the demo spot."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  // --------------------
  // SUBMIT REPORT
  // --------------------

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!category || !impact) {
      setError(
        "Pick what happened and how it affects people."
      );
      return;
    }

    if (!coords) {
      setError(
        "Add your location so we know where it is."
      );
      return;
    }

    setError("");
    setSent(false);
    setSubmitting(true);

    const report: Report = {
      id: crypto.randomUUID(),

      category,
      impact,
      conditionClass: duration,

      latitude: coords.latitude,
      longitude: coords.longitude,

      location:
        locationName.trim() ||
        (coords.latitude ===
          DEMO_COORDS.latitude &&
        coords.longitude ===
          DEMO_COORDS.longitude
          ? "Marshall Student Center"
          : "Your location"),

      note:
        note.trim() || undefined,

      minutesAgo: 0,
      confirmations: 0,
      affectsRoute: false,
    };

    try {
      // Convert Connie's frontend object
      // into the backend input.
      const backendInput =
        toReportInput(
          report,
          coords
        );

      // Save to Supabase.
      await createReport(
        backendInput
      );

      // Keep local UI behavior.
      saveMyReports([
        report,
        ...myReports,
      ]);

      saveAlert(
        alertFromReport(report)
      );

      // Reload active reports from
      // Supabase so Near You updates.
      await loadReports();

      // Reset the form.
      setCategory(null);
      setImpact(null);
      setDuration("temporary");
      setCoords(null);
      setLocStatus("");
      setLocationName("");
      setNote("");
      setSent(true);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong while submitting the report."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }
  // --------------------
// CLEAR MY REPORTS
// --------------------

async function handleClearReports() {
  try {
    setError("");
    setClearing(true);

    await resolveMyReports();

    // Remove this device's saved report history.
    saveMyReports([]);

    // Reload active reports from Supabase.
    await loadReports();

    setSent(false);
  } catch (err) {
    console.error(
      "Could not clear reports:",
      err
    );

    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(
        "Something went wrong while clearing your reports."
      );
    }
  } finally {
    setClearing(false);
  }
}
  return (
    <>
      <PageHeader
        title="Report an issue"
        subtitle="Help others around campus"
        tone="blush"
      />

      <div className="-mt-6 space-y-6 px-4">
        {/* SUCCESS */}

        {sent && (
          <p className="flex items-center gap-2 rounded-3xl bg-mint p-4 text-sm font-semibold">
            <Check className="size-5 shrink-0 text-leaf" />

            Thanks for reporting!
            Other people&apos;s routes
            will update.
          </p>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl bg-white p-5 shadow-sm"
        >
          {/* TYPE */}

          <div>
            <h2 className="font-display mb-3 text-xl font-bold">
              What&apos;s going on?
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {reportCategories.map(
                ({
                  value,
                  label,
                  icon: Icon,
                }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCategory(value);
                      setSent(false);
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-sm font-semibold ${
                      category === value
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-cream text-ink"
                    }`}
                  >
                    <Icon
                      className="size-7"
                      strokeWidth={1.75}
                    />

                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* IMPACT */}

          <div>
            <h3 className="mb-2 text-sm font-bold">
              Who does it affect?
            </h3>

            <ChipGroup
              options={impactOptions}
              selected={
                impact
                  ? [impact]
                  : []
              }
              onToggle={(v) =>
                setImpact(
                  v as ReportImpact
                )
              }
            />
          </div>

          {/* DURATION */}

          <div>
            <h3 className="mb-2 text-sm font-bold">
              How long will it last?
            </h3>

            <ChipGroup
              options={durationOptions}
              selected={[duration]}
              onToggle={(v) =>
                setDuration(
                  v as ConditionClass
                )
              }
            />
          </div>

          {/* COORDINATES */}

          <div>
            <h3 className="mb-1 text-sm font-bold">
              Where is it?
            </h3>

            <p className="mb-2 text-xs text-ink/60">
              Reports are placed where
              you&apos;re standing, so
              you need to be close to it.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  findMyLocation
                }
                className="flex items-center gap-1.5 rounded-full bg-aqua px-4 py-2 text-sm font-semibold"
              >
                <LocateFixed className="size-4" />

                Use my location
              </button>

              <button
                type="button"
                onClick={() => {
                  setCoords(
                    DEMO_COORDS
                  );

                  setLocationName(
                    "Marshall Student Center"
                  );

                  setLocStatus(
                    "Using the demo spot (Marshall Student Center)"
                  );
                }}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70"
              >
                Use demo spot
              </button>
            </div>

            {locStatus && (
              <p className="mt-2 text-xs text-ink/70">
                {locStatus}
              </p>
            )}
          </div>

          {/* PLACE NAME */}

          <div>
            <label
              htmlFor="locationName"
              className="mb-1 block text-sm font-bold"
            >
              Place name (optional)
            </label>

            <input
              id="locationName"
              value={locationName}
              onChange={(e) =>
                setLocationName(
                  e.target.value
                )
              }
              placeholder="Marshall Student Center"
              className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
            />
          </div>

          {/* DETAILS */}

          <div>
            <label
              htmlFor="note"
              className="mb-1 block text-sm font-bold"
            >
              Details (optional)
            </label>

            <textarea
              id="note"
              value={note}
              onChange={(e) =>
                setNote(
                  e.target.value
                )
              }
              rows={2}
              placeholder="Ramp blocked by construction fencing"
              className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
            />
          </div>

          {/* ERROR */}

          {error && (
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink py-3.5 font-semibold text-white active:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : "Submit report"}
          </button>
        </form>

        {/* REAL ACTIVE REPORT */}

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">
            Near you
          </h2>

          {nearbyReport ? (
            <StillThereCard
              report={nearbyReport}
            />
          ) : (
            <p className="text-sm text-ink/60">
              No active reports nearby.
            </p>
          )}
        </section>

        {/* LOCAL REPORT HISTORY */}

        {myReports.length > 0 && (
          <section className="space-y-2">
<div className="flex items-center justify-between gap-3">
  <h2 className="font-display text-xl font-bold">
    Your reports
  </h2>

  <button
    type="button"
    onClick={handleClearReports}
    disabled={clearing}
    className="text-xs font-semibold text-ink/60 underline underline-offset-4 disabled:opacity-50"
  >
    {clearing
      ? "Clearing..."
      : "Clear my reports"}
  </button>
</div>

            {myReports.map((r) => {
              const info =
                categoryInfo(
                  r.category
                );

              const Icon =
                info.icon;

              return (
                <div
                  key={r.id}
                  className="rounded-3xl bg-white p-4 shadow-sm"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-leaf" />

                    {info.label}
                  </p>

                  <p className="text-sm text-ink/70">
                    {
                      impactOptions.find(
                        (i) =>
                          i.value ===
                          r.impact
                      )?.label
                    }

                    {r.location &&
                      ` · ${r.location}`}

                    {r.note &&
                      ` · ${r.note}`}
                  </p>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
}