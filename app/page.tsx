import PageHeader from "@/components/PageHeader";
import WeatherCard from "@/components/WeatherCard";
import CommuteCard from "@/components/CommuteCard";
import ParkingCard from "@/components/ParkingCard";
import Timeline from "@/components/Timeline";
import DayAlert from "@/components/DayAlert";
import { mockDay } from "@/data/mock";

// The Today screen just arranges the components and hands each its slice of mock data.
// Later, mockDay gets replaced by a real API call and nothing else changes.
export default function TodayPage() {
  const day = mockDay;
  return (
    <>
      <PageHeader title="Here's Your Day" />
      <WeatherCard weather={day.weather} date={day.date} />
      <div className="space-y-4 p-4">
        {day.alert && <DayAlert message={day.alert.message} />}
        <CommuteCard
          leaveBy={day.leaveBy}
          driveMinutes={day.driveMinutes}
          arriveBy={day.arriveBy}
          reason={day.leaveByReason}
        />
        <ParkingCard parking={day.parking} />
        <Timeline events={day.events} legs={day.legs} />
      </div>
    </>
  );
}
