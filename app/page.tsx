"use client";

import PageHeader from "@/components/PageHeader";
import WeatherCard from "@/components/WeatherCard";
import CommuteCard from "@/components/CommuteCard";
import ParkingCard from "@/components/ParkingCard";
import Timeline from "@/components/Timeline";
import DayAlert from "@/components/DayAlert";
import { mockDay, type RouteAlert } from "@/data/mock";
import { ALERT_KEY } from "@/lib/alerts";
import { minusMinutes } from "@/lib/time";
import { useStoredState } from "@/lib/useStoredState";

// The Today screen arranges the components and hands each its slice of mock data.
// The alert is stored in localStorage, so the Report screen can turn it on or off.
// Later, mockDay gets replaced by a real API call and the components stay the same.
export default function TodayPage() {
  const day = mockDay;
  const [alert, saveAlert] = useStoredState<RouteAlert | null>(ALERT_KEY, day.alert);

  // With an alert active, leave earlier by the extra minutes.
  const leaveBy = alert ? minusMinutes(day.leaveBy, alert.extraMinutes) : day.leaveBy;
  const reason = alert ? "Leaving earlier because of a new report on your route" : day.leaveByReason;

  return (
    <>
      <PageHeader title="Here's Your Day" />
      <WeatherCard weather={day.weather} date={day.date} />
      <div className="space-y-4 p-4">
        <DayAlert alert={alert} onDismiss={() => saveAlert(null)} onReset={() => saveAlert(day.alert)} />
        <CommuteCard
          leaveBy={leaveBy}
          driveMinutes={day.driveMinutes}
          arriveBy={day.arriveBy}
          reason={reason}
        />
        <ParkingCard parking={day.parking} />
        <Timeline events={day.events} legs={day.legs} />
      </div>
    </>
  );
}
