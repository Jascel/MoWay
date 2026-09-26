"use client";

import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import WeatherCard from "@/components/WeatherCard";
import CommuteCard from "@/components/CommuteCard";
import ParkingCard from "@/components/ParkingCard";
import Timeline from "@/components/Timeline";
import DayAlert from "@/components/DayAlert";
import { mockDay, mockProfile, type Profile, type RouteAlert, type SavedEvent } from "@/data/mock";
import { ALERT_KEY } from "@/lib/alerts";
import { minusMinutes } from "@/lib/time";
import { PROFILE_KEY } from "@/lib/options";
import { useStoredState } from "@/lib/useStoredState";

// The Today screen arranges the components and hands each its slice of mock data.
// The alert is stored in localStorage, so the Report screen can turn it on or off.
// Later, mockDay gets replaced by a real API call and the components stay the same.
export default function TodayPage() {
  const day = mockDay;
  const [alert, saveAlert] = useStoredState<RouteAlert | null>(ALERT_KEY, day.alert);

  // Events added on the Add screen for this day get mixed in with the mock ones, sorted by start time.
  const [added] = useStoredState<SavedEvent[]>("moway.events", []);
  const events = [...day.events, ...added.filter((e) => e.date === day.date)].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  // Your Profile settings (name, parking buffer) are saved by the Profile screen.
  const [profile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);

  // Arrive `parkingBufferMinutes` before your first class, then work backwards by the drive.
  // (Andres's routing will replace this with real traffic later.)
  const arriveBy = minusMinutes(events[0].start, profile.parkingBufferMinutes);
  const baseLeaveBy = minusMinutes(arriveBy, day.driveMinutes);

  // With an alert active, leave earlier by the extra minutes.
  const leaveBy = alert ? minusMinutes(baseLeaveBy, alert.extraMinutes) : baseLeaveBy;
  const reason = alert ? "Leaving earlier because of a new report on your route" : day.leaveByReason;

  return (
    <>
      <PageHeader
        title={`Hi ${profile.name || "there"}`}
        subtitle="Here's your day"
        right={<Avatar name={profile.name} />}
        large
        brand
      >
        <WeatherCard weather={day.weather} date={day.date} />
      </PageHeader>
      <div className="-mt-6 space-y-6 px-4 pb-4">
        <DayAlert alert={alert} onDismiss={() => saveAlert(null)} onReset={() => saveAlert(day.alert)} />
        <CommuteCard
          leaveBy={leaveBy}
          driveMinutes={day.driveMinutes}
          arriveBy={arriveBy}
          reason={reason}
        />
        <ParkingCard parking={day.parking} />
        <Timeline events={events} legs={day.legs} />
      </div>
    </>
  );
}
