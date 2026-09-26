"use client";

import { useEffect, useState } from "react";
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
import { ALERT_KEY } from "@/lib/alerts";
import { minusMinutes } from "@/lib/time";
import { PROFILE_KEY } from "@/lib/options";
import { useStoredState } from "@/lib/useStoredState";
import { getScheduleForDate } from "@/lib/database/schedule";

type DatabaseScheduleEvent = {
  id: string;
  title: string;
  category: SavedEvent["category"];
  building: string;
  room: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
};

export default function TodayPage() {
  const day = mockDay;

  const [alert, saveAlert] =
    useStoredState<RouteAlert | null>(
      ALERT_KEY,
      day.alert
    );

  const [profile] = useStoredState<Profile>(
    PROFILE_KEY,
    mockProfile
  );

  const [databaseEvents, setDatabaseEvents] =
    useState<SavedEvent[]>([]);

  // Load this user's schedule from Supabase.
  useEffect(() => {
    async function loadSchedule() {
      try {
        const rows = await getScheduleForDate(day.date);

        const savedEvents: SavedEvent[] = (
          rows as DatabaseScheduleEvent[]
        ).map((row) => ({
          id: row.id,
          category: row.category,
          title: row.title,
          building: row.building,
          room: row.room || undefined,
          date: row.event_date,

          // PostgreSQL may return time values with seconds.
          // The rest of MoWay currently uses HH:MM.
          start: row.start_time.slice(0, 5),
          end: row.end_time.slice(0, 5),
        }));

        setDatabaseEvents(savedEvents);
      } catch (error) {
        console.error(
          "Could not load schedule from Supabase:",
          error
        );
      }
    }

    loadSchedule();
  }, [day.date]);

  // Keep the demo schedule, then add the user's real
  // Supabase events for this date.
  const events = [
    ...day.events,
    ...databaseEvents,
  ].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  // Arrive before the first event using the user's
  // preferred parking buffer.
  const firstEvent = events[0];

  const arriveBy = firstEvent
    ? minusMinutes(
        firstEvent.start,
        profile.parkingBufferMinutes
      )
    : day.arriveBy;

  const baseLeaveBy = minusMinutes(
    arriveBy,
    day.driveMinutes
  );

  // Active route reports can make the user leave earlier.
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
        right={<Avatar name={profile.name} />}
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
          driveMinutes={day.driveMinutes}
          arriveBy={arriveBy}
          reason={reason}
        />

        <ParkingCard parking={day.parking} />

        <Timeline
          events={events}
          legs={day.legs}
        />
      </div>
    </>
  );
}