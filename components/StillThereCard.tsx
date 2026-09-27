"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { mockProfile, type Profile, type Report } from "@/data/mock";
import { categoryInfo } from "@/lib/reportCategories";
import { isBlockingForMe } from "@/lib/maps/route-hazards";
import { campusMode, type CampusMode } from "@/lib/profileMode";
import { PROFILE_KEY } from "@/lib/options";
import { useStoredState } from "@/lib/useStoredState";
import { confirmReport } from "@/lib/database/reports";

function campusModeCopy(mode: CampusMode): string {
  switch (mode) {
    case "walking":
      return "walking";
    case "wheelchair":
      return "rolling";
    case "scooter":
    case "bike":
      return "ride";
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

function confirmationMessage(report: Report, mode: CampusMode, affectsMyMode: boolean): string {
  if (report.impact === "inconvenience") {
    return "Confirmed. Thanks for the update.";
  }
  if (!affectsMyMode) {
    if (mode === "scooter" || mode === "bike") {
      return "Confirmed. Doesn't affect your ride.";
    }
    return `Confirmed. Doesn't affect your ${campusModeCopy(mode)} route.`;
  }
  return `Confirmed. This can block your ${campusModeCopy(mode)} route.`;
}

export default function StillThereCard({
  report,
}: {
  report: Report;
}) {
  const [answer, setAnswer] =
    useState<"yes" | "no" | "done" | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [profile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);
  const mode = campusMode(profile);
  const affectsMyMode = isBlockingForMe(report, mode);

  const info = categoryInfo(
    report.category
  );

  const Icon = info.icon;

  const confirmations =
    report.confirmations;

  async function handleAnswer(
    stillThere: boolean
  ) {
    try {
      setSubmitting(true);
      setError("");

      // Save confirmation to Supabase.
      await confirmReport(
        report.id,
        stillThere
      );

      if (stillThere) {
        setAnswer("yes");
      } else {
        setAnswer("no");
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("already confirmed")
      ) {
        setAnswer("done");
        return;
      }

      console.error(
        "Could not confirm report:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong while confirming the report."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-blush bg-blush/25 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-leaf">
        Is it still there?
      </p>

      <p className="mt-1 flex items-center gap-2 text-xl font-bold">
        <Icon className="size-5" />
        {info.label}
      </p>

      <p className="text-sm">
        {report.location}
      </p>

      {report.note && (
        <p className="mt-1 text-sm text-ink/70">
          {report.note}
        </p>
      )}

      <p className="mt-2 text-xs text-ink/60">
        Reported {report.minutesAgo} min ago ·{" "}
        {confirmations} confirmed
      </p>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {answer === null ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              handleAnswer(true)
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3 font-semibold text-white active:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="size-4" />

            {submitting
              ? "Saving..."
              : "Yes, still there"}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              handleAnswer(false)
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/20 bg-white py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" />

            No, it&apos;s clear
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-medium text-ink">
          Thanks!{" "}
          {answer === "yes"
            ? confirmationMessage(report, mode, affectsMyMode)
            : answer === "no"
              ? "We'll let others know it's clear."
              : "You already answered this one. Thanks for helping!"}
        </p>
      )}
    </section>
  );
}
