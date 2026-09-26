"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import WeatherCard from "@/components/WeatherCard";
import CommuteCard from "@/components/CommuteCard";
import ParkingCard from "@/components/ParkingCard";
import Timeline from "@/components/Timeline";
import DayAlert from "@/components/DayAlert";

import {
  mockDay,
  mockProfile,
  type Profile,
  type RouteAlert,
  type SavedEvent,
} from "@/data/mock";

import { ALERT_KEY, alertFromReport } from "@/lib/alerts";
import { useLiveReport } from "@/lib/database/useLiveReport";
import { getScheduleForDate } from "@/lib/database/schedule";
import { minusMinutes } from "@/lib/time";
import { PROFILE_KEY } from "@/lib/options";
import { ONBOARDED_KEY } from "@/lib/onboarding";
import { useDriveEstimate } from "@/lib/driveTime";
import { useStoredState } from "@/lib/useStoredState";

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

  const events = [
    ...day.events,
    ...added,
  ].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  // --------------------
  // PROFILE
  // --------------------

  const [profile] = useStoredState<Profile>(
    PROFILE_KEY,
    mockProfile
  );

  // --------------------
  // COMMUTE
  // --------------------

  const drive = useDriveEstimate(
    profile.homeAddress ?? ""
  );

  const driveMinutes =
    drive.minutes ?? day.driveMinutes;

  const arriveBy = minusMinutes(
    events[0].start,
    profile.parkingBufferMinutes
  );

  const baseLeaveBy = minusMinutes(
    arriveBy,
    driveMinutes
  );

  if (!loaded || !onboarded) {
    return null;
  }

  const leaveBy = alert
    ? minusMinutes(
        baseLeaveBy,
        alert.extraMinutes
      )
    : baseLeaveBy;

  const reason = alert
    ? "Leaving earlier because of a new report on your route"
    : day.leaveByReason;

  return (
    <>
      <PageHeader
        title={`Hi ${profile.name || "there"}`}
        subtitle="Here's your day"
        right={
          <Avatar
            name={profile.name}
            photo={profile.photo}
          />
        }
        large
        brand
      >
        <WeatherCard
          weather={day.weather}
          date={day.date}
        />
      </PageHeader>

      <div className="-mt-6 space-y-6 px-4 pb-4">
        <DayAlert
          alert={alert}
          onDismiss={() => saveAlert(null)}
          onReset={() => saveAlert(day.alert)}
        />

        <CommuteCard
          leaveBy={leaveBy}
          driveMinutes={driveMinutes}
          arriveBy={arriveBy}
          reason={reason}
          hasHome={Boolean(
            profile.homeAddress?.trim()
          )}
        />

        <ParkingCard
          parking={day.parking}
        />

        <Timeline
          events={events}
          legs={day.legs}
          homeTrip={{
            walkMinutes: 2,
            driveMinutes,
          }}
        />
      </div>
    </>
  );
}