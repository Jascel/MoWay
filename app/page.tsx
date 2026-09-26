"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ONBOARDED_KEY } from "@/lib/onboarding";
import { useDriveEstimate } from "@/lib/driveTime";
import { useStoredState } from "@/lib/useStoredState";

// The Today screen arranges the components and hands each its slice of mock data.
// The alert is stored in localStorage, so the Report screen can turn it on or off.
// Later, mockDay gets replaced by a real API call and the components stay the same.
export default function TodayPage() {
  const day = mockDay;
  const router = useRouter();

  // New visitors go to the welcome screens first.
  const [onboarded, , loaded] = useStoredState<boolean>(ONBOARDED_KEY, false);
  useEffect(() => {
    if (loaded && !onboarded) router.replace("/welcome");
  }, [loaded, onboarded, router]);
  const [alert, saveAlert] = useStoredState<RouteAlert | null>(ALERT_KEY, day.alert);

  // Events added on the Add screen for this day get mixed in with the mock ones, sorted by start time.
  const [added] = useStoredState<SavedEvent[]>("moway.events", []);
  const events = [...day.events, ...added.filter((e) => e.date === day.date)].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  // Your Profile settings (name, parking buffer) are saved by the Profile screen.
  const [profile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);

  // Real drive time from the home address when we have one; otherwise the demo number.
  const drive = useDriveEstimate(profile.homeAddress ?? "");
  const driveMinutes = drive.minutes ?? day.driveMinutes;

  // Arrive `parkingBufferMinutes` before your first class, then work backwards by the drive.
  // (Andres's routing will replace this with real traffic later.)
  const arriveBy = minusMinutes(events[0].start, profile.parkingBufferMinutes);
  const baseLeaveBy = minusMinutes(arriveBy, driveMinutes);

  if (!loaded || !onboarded) return null; // wait for the saved value (or redirect to /welcome)

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
          driveMinutes={driveMinutes}
          arriveBy={arriveBy}
          reason={reason}
          hasHome={Boolean(profile.homeAddress?.trim())}
        />
        <ParkingCard parking={day.parking} />
        <Timeline events={events} legs={day.legs} />
      </div>
    </>
  );
}
