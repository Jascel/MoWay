"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import ThankYou from "@/components/ThankYou";
import EmptyState from "@/components/EmptyState";
import SkeletonCard from "@/components/SkeletonCard";
import StillThereCard from "@/components/StillThereCard";
import LocationPicker from "@/components/maps/LocationPicker";

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
} from "@/data/mock";

import {
  createReport,
  resolveMyReports,
} from "@/lib/database/reports";

import { toReportInput } from "@/lib/backendMapping";
import { rowToReport } from "@/lib/database/mapReport";
import { isNearCampus } from "@/lib/campus";
import { useActiveReports } from "@/lib/database/useActiveReports";

type Coords = {
  latitude: number;
  longitude: number;
};

export default function ReportPage() {
  const [myReports, saveMyReports] =
    useStoredState<Report[]>(REPORTS_KEY, []);

  const [category, setCategory] =
    useState<ReportCategory | null>(null);

  const [impact, setImpact] =
    useState<ReportImpact | null>(null);

  const [duration, setDuration] =
    useState<ConditionClass>("temporary");

  const [coords, setCoords] =
    useState<Coords | null>(null);

  // The person's real position, if they shared it (only used when they tap "Use my location").
  const [userCoords, setUserCoords] =
    useState<Coords | null>(null);

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

  // --------------------
  // LOAD ACTIVE REPORTS
  // --------------------
// --------------------
// ACTIVE REPORTS
// --------------------

const {
  reports: activeReports,
  refresh: refreshReports,
  loading: reportsLoading,
} = useActiveReports();

// "Near you" only lists reports near campus.
const nearbyReports = activeReports
  .filter((r) => isNearCampus(r.latitude, r.longitude))
  .sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  )
  .map(rowToReport);

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
        "Search for the place, tap the map, or drag the pin to where the problem is."
      );
      return;
    }

    setError("");
    setSent(false);
    setSubmitting(true);

    const report: Report = {
      id: crypto.randomUUID(),
      status: "unconfirmed",

      category,
      impact,
      conditionClass: duration,

      latitude: coords.latitude,
      longitude: coords.longitude,

      location:
        locationName.trim() || "Pinned location",

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
          userCoords ?? coords
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

      // Reload active reports from
      // Supabase so Near You updates.
      await refreshReports();

      // Reset the form.
      setCategory(null);
      setImpact(null);
      setDuration("temporary");
      setCoords(null);
      setUserCoords(null);
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
    await refreshReports();

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

        {sent && <ThankYou />}

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
                        ? "animate-pop border-ink bg-ink text-white"
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

          {/* WHERE IS IT? */}

          <LocationPicker
            value={coords}
            name={locationName}
            onPick={(picked, pickedName) => {
              setCoords(picked);
              setLocationName(pickedName);
            }}
            onNameChange={setLocationName}
            onUserLocation={setUserCoords}
          />

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

          {reportsLoading ? (
            <SkeletonCard />
          ) : nearbyReports.length > 0 ? (
            nearbyReports.map((report) => (
              <StillThereCard key={report.id} report={report} />
            ))
          ) : (
            <EmptyState
              icon={CircleCheck}
              title="All clear on campus"
              text="No active reports nearby right now."
            />
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
