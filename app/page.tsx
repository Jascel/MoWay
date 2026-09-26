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
import Link from "next/link";
import EventEditor from "@/components/EventEditor";
import { mockDay, mockProfile, type ClassEvent, type Profile, type RouteAlert, type SavedEvent } from "@/data/mock";
import { ALERT_KEY, alertFromReport } from "@/lib/alerts";
import { useLiveReport } from "@/lib/database/useLiveReport";
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

  // A new community report (from anyone, live) turns on the alert once. Dismissing it keeps it dismissed.
  const liveReport = useLiveReport();
  const [seenReportId, saveSeenReportId] = useStoredState<string | null>("moway.lastLiveReport", null);
  useEffect(() => {
    if (liveReport && liveReport.id !== seenReportId) {
      saveSeenReportId(liveReport.id);
      saveAlert(alertFromReport(liveReport));
    }
  }, [liveReport, seenReportId, saveSeenReportId, saveAlert]);

  // Events added on the Add screen for this day get mixed in with the mock ones, sorted by start time.
  // The demo classes can be deleted (hidden) or edited too. Both are remembered in the browser.
  const [added, saveAdded] = useStoredState<SavedEvent[]>("moway.events", []);
  const [hiddenIds, saveHidden] = useStoredState<string[]>("moway.hiddenEvents.v1", []);
  const [edits, saveEdits] = useStoredState<Record<string, ClassEvent>>("moway.eventEdits.v1", {});
  const [editing, setEditing] = useState<ClassEvent | null>(null);

  const baseEvents = day.events.filter((e) => !hiddenIds.includes(e.id)).map((e) => edits[e.id] ?? e);
  const events = [...baseEvents, ...added.filter((e) => e.date === day.date)].sort((a, b) =>
    a.start.localeCompare(b.start)
  );
  const hiddenCount = day.events.filter((e) => hiddenIds.includes(e.id)).length;

  function deleteEvent(ev: ClassEvent) {
    if (added.some((a) => a.id === ev.id)) saveAdded(added.filter((a) => a.id !== ev.id));
    else saveHidden([...hiddenIds, ev.id]);
  }

  function saveEdit(updated: ClassEvent) {
    if (added.some((a) => a.id === updated.id)) {
      saveAdded(added.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    } else {
      saveEdits({ ...edits, [updated.id]: updated });
    }
    setEditing(null);
  }

  // Your Profile settings (name, parking buffer) are saved by the Profile screen.
  const [profile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);

  // Real drive time from the home address when we have one; otherwise the demo number.
  const drive = useDriveEstimate(profile.homeAddress ?? "");
  const driveMinutes = drive.minutes ?? day.driveMinutes;

  // Arrive `parkingBufferMinutes` before your first class, then work backwards by the drive.
  // (Andres's routing will replace this with real traffic later.)
  const first = events[0];
  const arriveBy = first ? minusMinutes(first.start, profile.parkingBufferMinutes) : null;
  const baseLeaveBy = arriveBy ? minusMinutes(arriveBy, driveMinutes) : null;

  if (!loaded || !onboarded) return null; // wait for the saved value (or redirect to /welcome)

  // With an alert active, leave earlier by the extra minutes.
  const leaveBy = baseLeaveBy && alert ? minusMinutes(baseLeaveBy, alert.extraMinutes) : baseLeaveBy;
  const reason = alert ? "Leaving earlier because of a new report on your route" : day.leaveByReason;

  return (
    <>
      <PageHeader
        title={`Hi ${profile.name || "there"}`}
        subtitle="Here's your day"
        right={<Avatar name={profile.name} photo={profile.photo} />}
        large
        brand
      >
        <WeatherCard weather={day.weather} date={day.date} />
      </PageHeader>
      <div className="-mt-6 space-y-6 px-4 pb-4">
        <DayAlert alert={alert} onDismiss={() => saveAlert(null)} onReset={() => saveAlert(day.alert)} />
        {leaveBy && arriveBy ? (
          <>
            <CommuteCard
              leaveBy={leaveBy}
              driveMinutes={driveMinutes}
              arriveBy={arriveBy}
              reason={reason}
              hasHome={Boolean(profile.homeAddress?.trim())}
            />
            <ParkingCard parking={day.parking} />
          </>
        ) : (
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
            <p className="font-display text-xl font-bold">Nothing on your schedule</p>
            <p className="mt-1 text-sm text-ink/70">Add a class or event and we&apos;ll plan your day.</p>
            <Link href="/add" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
              Add something
            </Link>
          </section>
        )}
        <Timeline
          events={events}
          legs={day.legs}
          homeTrip={{ walkMinutes: 2, driveMinutes }}
          onEdit={setEditing}
          onDelete={deleteEvent}
          hiddenCount={hiddenCount}
          onRestore={() => saveHidden([])}
        />
      </div>
      {editing && <EventEditor event={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
    </>
  );
}
