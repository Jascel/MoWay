"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import StillThereCard from "@/components/StillThereCard";
import { reportCategories, categoryInfo } from "@/lib/reportCategories";
import { useStoredState } from "@/lib/useStoredState";
import {
  mockReport,
  type Report,
  type ReportCategory,
  type RouteAlert,
} from "@/data/mock";
import { ALERT_KEY, alertFromReport } from "@/lib/alerts";
import {
  createReport,
  type ReportType,
  type ReportImpact,
  type ConditionClass,
} from "@/lib/database/reports";

export default function ReportPage() {
  const [myReports, saveMyReports] = useStoredState<Report[]>(
    "moway.reports",
    []
  );

  const [, saveAlert] = useStoredState<RouteAlert | null>(
    ALERT_KEY,
    null
  );

  const [category, setCategory] =
    useState<ReportCategory | null>(null);

  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Location services are not supported by this browser."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  function convertCategory(
    selectedCategory: ReportCategory
  ): ReportType {
    switch (selectedCategory) {
      case "construction":
        return "construction";

      case "blocked":
        return "blocked_sidewalk";

      case "flooding":
        return "flooding";

      case "entrance":
        return "accessible_entrance_closed";

      default:
        return "other";
    }
  }

  function getConditionClass(
    reportType: ReportType
  ): ConditionClass {
    if (reportType === "sidewalk_ends") {
      return "infrastructure";
    }

    return "temporary";
  }

  function getImpact(
    selectedCategory: ReportCategory
  ): ReportImpact {
    switch (selectedCategory) {
      case "blocked":
      case "entrance":
        return "blocks_wheelchair";

      case "construction":
      case "flooding":
        return "blocks_walking";

      default:
        return "inconvenience";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!category || !location.trim()) {
      setError("Pick what happened and where.");
      return;
    }

    setError("");
    setSent(false);
    setSubmitting(true);

    try {
      const position = await getCurrentPosition();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const reportType = convertCategory(category);

      await createReport({
        reportType,
        impact: getImpact(category),
        conditionClass: getConditionClass(reportType),

        // For the MVP, the user's current GPS position
        // is also the reported issue location.
        latitude,
        longitude,

        userLatitude: latitude,
        userLongitude: longitude,
      });

      // Keep Connie's local report behavior so the UI
      // and Today alert continue working.
      const localReport: Report = {
        id: crypto.randomUUID(),
        category,
        location: location.trim(),
        note: note.trim() || undefined,
        minutesAgo: 0,
        confirmations: 1,
        affectsRoute: false,
      };

      saveMyReports([localReport, ...myReports]);
      saveAlert(alertFromReport(localReport));

      setCategory(null);
      setLocation("");
      setNote("");
      setSent(true);
    } catch (err) {
      console.error(err);

      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location permission is required to submit a report."
          );
        } else {
          setError(
            "We couldn't get your location. Please try again."
          );
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while submitting.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Report an issue"
        subtitle="Help others around campus"
      />

      <div className="space-y-6 p-4">
        {sent && (
          <p className="rounded-2xl bg-usf-green-light p-4 text-sm font-medium text-usf-green-dark">
            Thanks for reporting! Other people&apos;s routes
            will update. 🙌
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold">
            What&apos;s going on?
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {reportCategories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setSent(false);
                }}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-sm font-medium ${
                  category === c.value
                    ? "border-usf-green bg-usf-green text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <span className="text-3xl">
                  {c.icon}
                </span>

                {c.label}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1 block text-sm font-bold"
            >
              Where?
            </label>

            <input
              id="location"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              placeholder="Ramp by the Marshall Student Center"
              className="w-full rounded-xl border border-gray-300 bg-white p-3"
            />
          </div>

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
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-300 bg-white p-3"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-usf-green py-3 font-semibold text-white active:bg-usf-green-dark disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : "Submit report"}
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">
            Near you
          </h2>

          <StillThereCard report={mockReport} />
        </section>

        {myReports.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold">
              Your reports
            </h2>

            {myReports.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl bg-white p-3 shadow-sm"
              >
                <p className="font-semibold">
                  {categoryInfo(r.category).icon}{" "}
                  {categoryInfo(r.category).label}
                </p>

                <p className="text-sm text-gray-600">
                  {r.location}
                </p>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}