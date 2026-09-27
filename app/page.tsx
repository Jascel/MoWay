"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { greetingFor } from "@/lib/greeting";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import WeatherCard from "@/components/WeatherCard";
import CommuteCard from "@/components/CommuteCard";
import ParkingCard from "@/components/ParkingCard";
import Timeline from "@/components/Timeline";
import EventEditor from "@/components/EventEditor";
import DayAlert from "@/components/DayAlert";
import LiveDot from "@/components/LiveDot";
import { pickAffectedLeg } from "@/lib/routeImpact";

import {
  mockDay,
  mockProfile,
  type ClassEvent,
  type Profile,
  type RouteAlert,
  type SavedEvent,
} from "@/data/mock";

import { ALERT_KEY, alertFromReport } from "@/lib/alerts";
import { buildDayLegs, minutesBackToGarage } from "@/lib/dayLegs";
import { useLiveReport } from "@/lib/database/useLiveReport";
import {
  deleteScheduleEvent,
  getScheduleForDate,
  updateScheduleEvent,
} from "@/lib/database/schedule";
import { minusMinutes } from "@/lib/time";
import { PROFILE_KEY } from "@/lib/options";
import { ONBOARDED_KEY } from "@/lib/onboarding";
import { useDriveEstimate } from "@/lib/driveTime";
import { useStoredState } from "@/lib/useStoredState";
import { findBuildingByLabel } from "@/lib/maps/campus-buildings";
import { CAMPUS_GARAGES } from "@/lib/maps/campus-parking";
import type { CampusBuilding } from "@/lib/maps/types";
import { campusMode } from "@/lib/profileMode";
import { planSmartPark, toParkingRecommendation } from "@/lib/smartPark";

export default function TodayPage() {
  const day = mockDay;
  const router = useRouter();

  // --------------------
  // ONBOARDING
  // --------------------

  const [onboarded, , loaded] = useStoredState<boolean>(
    ONBOARDED_KEY,
    false
  );

  useEffect(() => {
    if (loaded && !onboarded) {
      router.replace("/welcome");
    }
  }, [loaded, onboarded, router]);

  // --------------------
  // LIVE REPORT ALERTS
  // --------------------

  const [alert, saveAlert] = useStoredState<RouteAlert | null>(
    ALERT_KEY,
    day.alert
  );

  const liveReport = useLiveReport();

  const [seenReportId, saveSeenReportId] = useStoredState<string | null>(
    "moway.lastLiveReport",
    null
  );

  useEffect(() => {
    if (
      liveReport &&
      liveReport.id !== seenReportId
    ) {
      saveSeenReportId(liveReport.id);
      saveAlert(alertFromReport(liveReport));
    }
  }, [
    liveReport,
    seenReportId,
    saveSeenReportId,
    saveAlert,
  ]);

  // --------------------
  // SCHEDULE
  // --------------------

  const [added, setAdded] = useState<SavedEvent[]>([]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const savedEvents = await getScheduleForDate(day.date);

        const formattedEvents: SavedEvent[] = savedEvents.map(
          (event) => ({
            id: event.id,
            category: event.category,
            title: event.title,
            building: event.building,
            room: event.room ?? undefined,
            date: event.event_date,
            start: event.start_time,
            end: event.end_time,
          })
        );

        setAdded(formattedEvents);
      } catch (error) {
        console.error(
          "Could not load schedule:",
          error
        );
      }
    }

    void loadSchedule();
  }, [day.date]);

  // Demo classes can be deleted (hidden) or edited on this device. Events saved in Supabase
  // are edited and deleted in Supabase.
  const [hiddenIds, saveHidden] = useStoredState<string[]>("moway.hiddenEvents.v1", []);
  const [edits, saveEdits] = useStoredState<Record<string, ClassEvent>>("moway.eventEdits.v1", {});
  const [editing, setEditing] = useState<ClassEvent | null>(null);

  const baseEvents = day.events
    .filter((e) => !hiddenIds.includes(e.id))
    .map((e) => edits[e.id] ?? e);

  const events = [...baseEvents, ...added].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  const hiddenCount = day.events.filter((e) => hiddenIds.includes(e.id)).length;

  async function deleteEvent(ev: ClassEvent) {
    if (added.some((a) => a.id === ev.id)) {
      try {
        await deleteScheduleEvent(ev.id);
        setAdded((prev) => prev.filter((a) => a.id !== ev.id));
      } catch (error) {
        console.error("Could not delete event:", error);
        window.alert("Sorry, that event could not be deleted. Try again.");
      }
    } else {
      saveHidden([...hiddenIds, ev.id]);
    }
  }

  async function saveEdit(updated: ClassEvent) {
    const saved = added.find((a) => a.id === updated.id);
    if (saved) {
      try {
        await updateScheduleEvent(updated.id, {
          title: updated.title,
          category: updated.category,
          building: updated.building,
          room: updated.room,
          date: saved.date,
          start: updated.start,
          end: updated.end,
        });
        setAdded((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
        setEditing(null);
      } catch (error) {
        console.error("Could not update event:", error);
        window.alert("Sorry, that change could not be saved. Try again.");
      }
    } else {
      saveEdits({ ...edits, [updated.id]: updated });
      setEditing(null);
    }
  }

  // --------------------
  // PROFILE
  // --------------------

  const [profile] = useStoredState<Profile>(
    PROFILE_KEY,
    mockProfile
  );

  // --------------------
  // SMART PARK + WALKING LEGS
  // --------------------

  // Rank the 3 garages by total campus travel for today's buildings in the user's campus
  // mode (wheelchair for a driver who rolls on campus). Events whose building we don't
  // have coordinates for are skipped. Falls back to the mock pick if nothing resolves.
  const mode = campusMode(profile);
  const dayBuildings = events
    .map((event) => findBuildingByLabel(event.building))
    .filter((building): building is CampusBuilding => building !== undefined);
  const smartPark = planSmartPark(CAMPUS_GARAGES, dayBuildings, mode);
  const parking =
    toParkingRecommendation(smartPark, { spotsLeftPercent: day.parking.spotsLeftPercent }) ?? day.parking;

  // The walks between stops use the same distance/speed math as Smart Park, so the
  // timeline and the card agree, and events you add or edit get a leg automatically.
  const garage = smartPark.winner?.garage;
  const legs = buildDayLegs(events, garage, mode);
  const walkToCarMinutes = minutesBackToGarage(events, garage, mode) ?? 2;

  // --------------------
  // COMMUTE
  // --------------------

  const drive = useDriveEstimate(
    profile.homeAddress ?? ""
  );

  const driveMinutes =
    drive.minutes ?? day.driveMinutes;

  const first = events[0];
  const affectedId = pickAffectedLeg(events, legs);

  const arriveBy = first
    ? minusMinutes(first.start, profile.parkingBufferMinutes)
    : null;

  const baseLeaveBy = arriveBy
    ? minusMinutes(arriveBy, driveMinutes)
    : null;

  if (!loaded || !onboarded) {
    return null;
  }

  const greeting = greetingFor(new Date().getHours());

  const leaveBy =
    baseLeaveBy && alert
      ? minusMinutes(baseLeaveBy, alert.extraMinutes)
      : baseLeaveBy;

  const reason = alert
    ? "Leaving earlier because of a new report on your route"
    : day.leaveByReason;

  return (
    <>
      <PageHeader
        title={`${greeting.hello}, ${profile.name || "there"}`}
        subtitle={greeting.line}
        right={
          <Avatar
            name={profile.name}
            photo={profile.photo}
          />
        }
        large
        brand
        status={process.env.NEXT_PUBLIC_SUPABASE_URL ? <LiveDot /> : undefined}
      >
        <WeatherCard
          weather={day.weather}
          date={day.date}
        />
      </PageHeader>

      <div className="animate-fade-up -mt-6 space-y-6 px-4 pb-4">
        <DayAlert
          alert={alert}
          onDismiss={() => saveAlert(null)}
          onReset={() => saveAlert(day.alert)}
        />

        {leaveBy && arriveBy ? (
          <>
            <CommuteCard
              leaveBy={leaveBy}
              driveMinutes={driveMinutes}
              arriveBy={arriveBy}
              reason={reason}
              hasHome={Boolean(profile.homeAddress?.trim())}
              changedFrom={alert && baseLeaveBy ? baseLeaveBy : undefined}
            />

            <ParkingCard parking={parking} campusMode={mode} />
          </>
        ) : (
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
            <p className="font-display text-xl font-bold">Nothing on your schedule</p>
            <p className="mt-1 text-sm text-ink/70">
              Add a class or event and we&apos;ll plan your day.
            </p>
            <Link
              href="/add"
              className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
            >
              Add something
            </Link>
          </section>
        )}

        <Timeline
          events={events}
          legs={legs}
          homeTrip={{ walkMinutes: walkToCarMinutes, driveMinutes }}
          campusMode={mode}
          onEdit={setEditing}
          onDelete={deleteEvent}
          hiddenCount={hiddenCount}
          onRestore={() => saveHidden([])}
          affected={affectedId && alert ? { toEventId: affectedId, extraMinutes: alert.extraMinutes } : null}
        />
      </div>

      {editing && (
        <EventEditor
          event={editing}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}