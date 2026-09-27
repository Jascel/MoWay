"use client";

import { useEffect, useMemo, useState } from "react";
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

import {
  mockDay,
  mockProfile,
  type ClassEvent,
  type Leg,
  type Profile,
} from "@/data/mock";

import {
  ALERT_KEY,
  reportForChoice,
  reconcileAlert,
  leaveByForFirstLeg,
  type DerivedAlert,
} from "@/lib/alerts";
import { buildDayLegs, minutesBackToGarage } from "@/lib/dayLegs";
import { rowToReport } from "@/lib/database/mapReport";
import { useActiveReports } from "@/lib/database/useActiveReports";
import { minusMinutes } from "@/lib/time";
import { PROFILE_KEY } from "@/lib/options";
import { ONBOARDED_KEY } from "@/lib/onboarding";
import { useDriveEstimate } from "@/lib/driveTime";
import { useStoredState } from "@/lib/useStoredState";
import { CAMPUS_BUILDINGS, findBuildingByLabel } from "@/lib/maps/campus-buildings";
import { CAMPUS_GARAGES } from "@/lib/maps/campus-parking";
import type { CampusBuilding } from "@/lib/maps/types";
import { campusMode, profileStartOrigin, profileUsesDriving } from "@/lib/profileMode";
import { planSmartPark, toParkingRecommendation } from "@/lib/smartPark";
import { useWalkingRoute } from "@/components/maps/use-walking-route";
import { chooseRoute } from "@/lib/maps/route-hazards";
import { isNearCampus } from "@/lib/campus";
import { useDaySchedule } from "@/lib/useDaySchedule";
import type { CampusPlace } from "@/lib/maps/types";
import { loadGeocodingLibrary } from "@/lib/maps/google-maps";

type TodayAlert = DerivedAlert;

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

  const [storedAlert, saveAlert] = useStoredState<TodayAlert | null>(
    ALERT_KEY,
    null
  );
  const alert = storedAlert?.identity ? storedAlert : null;

  const [seenReportIdentity, saveSeenReportIdentity] = useStoredState<string | null>(
    "moway.lastLiveReport",
    null
  );

  // --------------------
  // SCHEDULE
  // --------------------

  const schedule = useDaySchedule(day.date);
  const [editing, setEditing] = useState<ClassEvent | null>(null);
  const events = [...schedule.events];

  // --------------------
  // PROFILE
  // --------------------

  const [profile] = useStoredState<Profile>(
    PROFILE_KEY,
    mockProfile
  );
  const driving = profileUsesDriving(profile);
  const [resolvedHomeOrigin, setResolvedHomeOrigin] = useState<{
    readonly address: string;
    readonly place: CampusPlace;
  } | null>(null);
  const [failedHomeAddress, setFailedHomeAddress] = useState<string | null>(null);
  const savedHomeAddress = profile.homeAddress?.trim() ?? "";
  const homeOrigin = !driving && savedHomeAddress.length > 0 && resolvedHomeOrigin?.address === savedHomeAddress
    ? resolvedHomeOrigin.place
    : null;
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  useEffect(() => {
    const address = savedHomeAddress;
    if (driving || address.length === 0 || googleMapsKey.length === 0) return;

    let cancelled = false;
    void loadGeocodingLibrary(googleMapsKey)
      .then(async (geocoding) => {
        const response = await new geocoding.Geocoder().geocode({ address, region: "us" });
        const result = response.results[0];
        if (cancelled) return;
        if (result === undefined) {
          setFailedHomeAddress(address);
          return;
        }
        const position = result.geometry.location;
        setResolvedHomeOrigin({
          address,
          place: {
            id: `home-address:${result.place_id}`,
            name: "Home",
            position: { lat: position.lat(), lng: position.lng() },
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof Error) {
          setFailedHomeAddress(address);
          return;
        }
        throw error;
      });

    return () => {
      cancelled = true;
    };
  }, [driving, googleMapsKey, savedHomeAddress]);

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
  const smartPark = driving ? planSmartPark(CAMPUS_GARAGES, dayBuildings, mode) : null;
  const parking = smartPark
    ? toParkingRecommendation(smartPark, { spotsLeftPercent: day.parking.spotsLeftPercent }) ?? day.parking
    : day.parking;

  // The walks between stops use the same distance/speed math as Smart Park, so the
  // timeline and the card agree, and events you add or edit get a leg automatically.
  const garage = smartPark?.winner?.garage;
  const startOrigin = profileStartOrigin(profile, garage, homeOrigin ?? undefined);
  const legsFromOrigin = buildDayLegs(events, startOrigin, mode);
  const legs = !driving && startOrigin
    ? legsFromOrigin.map((leg) => leg.fromEventId === "parking"
      ? { ...leg, fromEventId: "home", tags: [`From ${startOrigin.name}`, ...leg.tags.slice(1)] }
      : leg)
    : legsFromOrigin;
  const walkToCarMinutes = driving ? minutesBackToGarage(events, garage, mode) ?? 2 : 0;

  const first = events[0];
  const firstBuilding = first ? findBuildingByLabel(first.building) : undefined;
  const routeOrigin: CampusPlace = startOrigin ?? (driving ? CAMPUS_GARAGES[0] : CAMPUS_BUILDINGS[0]) ?? {
    id: "today-origin-unavailable",
    name: "Starting location unavailable",
    position: { lat: 0, lng: 0 },
  };
  const routeDestination: CampusPlace = firstBuilding ?? CAMPUS_BUILDINGS[0] ?? {
    id: "today-destination",
    code: "",
    name: "First class",
    position: { lat: 0, lng: 0 },
  };
  const {
    state: routeState,
    requestRoute,
    resetRoute,
  } = useWalkingRoute(googleMapsKey, routeOrigin, routeDestination);

  useEffect(() => {
    if (
      !schedule.loaded ||
      googleMapsKey.length === 0 ||
      startOrigin === undefined ||
      firstBuilding === undefined ||
      routeOrigin.id === routeDestination.id
    ) {
      return;
    }
    resetRoute();
    void requestRoute();
  }, [
    firstBuilding,
    googleMapsKey,
    requestRoute,
    resetRoute,
    routeDestination.id,
    routeOrigin.id,
    schedule.loaded,
    startOrigin,
  ]);

  const { reports: reportRows, loading: reportsLoading, error: reportsError } = useActiveReports();
  const reports = useMemo(
    () => reportRows
      .filter((row) => isNearCampus(row.latitude, row.longitude))
      .map(rowToReport),
    [reportRows],
  );
  const routeMatchesCurrentPlaces = schedule.loaded
    && startOrigin !== undefined
    && firstBuilding !== undefined
    && routeState.kind === "success"
    && routeState.candidates.every(
      (candidate) => candidate.originId === routeOrigin.id && candidate.destinationId === routeDestination.id,
    );
  const choice = routeMatchesCurrentPlaces && routeState.kind === "success"
    ? chooseRoute(routeState.candidates, reports, mode)
    : null;

  const baselineFirstLeg = legs.find(
    (leg) => leg.fromEventId === (driving ? "parking" : "home") && leg.toEventId === first?.id,
  );
  const selectedFirstLeg = choice?.chosen && baselineFirstLeg
    ? {
        ...baselineFirstLeg,
        minutes: choice.selectedMinutes,
        distanceMeters: choice.chosen.distanceMeters,
        tags: [...new Set([...choice.chips, `From ${routeOrigin.name}`, "Google route"])],
      }
    : baselineFirstLeg;
  const displayLegs: Leg[] = selectedFirstLeg
    ? legs.map((leg) => leg === baselineFirstLeg ? selectedFirstLeg : leg)
    : legs;
  const selectedFirstLegMinutes = selectedFirstLeg?.minutes ?? 0;
  const baselineFirstLegMinutes = choice?.chosen
    ? Math.max(0, selectedFirstLegMinutes - choice.extraMinutes)
    : (baselineFirstLeg?.minutes ?? selectedFirstLegMinutes);

  const routeReport = choice === null ? null : reportForChoice(choice, mode);
  const reportsReady = !reportsLoading && reportsError === null;

  useEffect(() => {
    const transition = reconcileAlert({
      storedAlert: alert,
      seenIdentity: seenReportIdentity,
      reports,
      routeReport,
      choice,
      mode,
      originId: routeOrigin.id,
      destinationId: routeDestination.id,
      refresh: reportsReady ? "success" : reportsError === null ? "pending" : "error",
    });
    if (transition === null) return;
    saveSeenReportIdentity(transition.identity);
    saveAlert({ ...transition.alert, identity: transition.identity });
  }, [
    alert,
    choice,
    reports,
    reportsError,
    reportsReady,
    routeDestination.id,
    routeOrigin.id,
    routeReport,
    mode,
    saveAlert,
    saveSeenReportIdentity,
    seenReportIdentity,
  ]);

  async function deleteEvent(event: ClassEvent): Promise<void> {
    try {
      await schedule.deleteEvent(event);
    } catch (error) {
      console.error("Could not delete event:", error);
      window.alert("Sorry, that event could not be deleted. Try again.");
    }
  }

  async function saveEdit(event: ClassEvent): Promise<void> {
    try {
      await schedule.saveEdit(event);
      setEditing(null);
    } catch (error) {
      console.error("Could not update event:", error);
      window.alert("Sorry, that change could not be saved. Try again.");
    }
  }

  // --------------------
  // COMMUTE
  // --------------------

  const drive = useDriveEstimate(profile.homeAddress ?? "");

  const driveMinutes =
    drive.minutes ?? day.driveMinutes;

  const arriveBy = first
    ? minusMinutes(first.start, profile.parkingBufferMinutes)
    : null;

  const baseLeaveBy = arriveBy
    ? leaveByForFirstLeg(arriveBy, driveMinutes, baselineFirstLegMinutes)
    : null;

  if (!loaded || !onboarded || !schedule.loaded) {
    return null;
  }

  const greeting = greetingFor(new Date().getHours());

  const leaveBy = arriveBy
    ? leaveByForFirstLeg(arriveBy, driveMinutes, selectedFirstLegMinutes)
    : null;

  const reason = (choice?.extraMinutes ?? 0) > 0
    ? "Leaving earlier because of a new report on your route"
    : `Arrive by ${arriveBy ?? "your first class"} to allow for parking and your first ${mode} leg.`;

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
        />

        {!driving && !homeOrigin && events.length > 0 && (
          <section className="rounded-3xl bg-white p-5 shadow-sm" role="status">
            <p className="font-display text-lg font-bold">Add your starting location</p>
            <p className="mt-1 text-sm text-ink/70">
              {failedHomeAddress === savedHomeAddress
                ? "We couldn’t locate your saved home address. Check it in your profile to plan the first trip."
                : "We need your saved home address to plan the first trip to campus."}
            </p>
            <Link href="/profile" className="mt-3 inline-block text-sm font-semibold underline">
              Set your address
            </Link>
          </section>
        )}

        {driving && leaveBy && arriveBy ? (
          <>
            <CommuteCard
              leaveBy={leaveBy}
              driveMinutes={driveMinutes}
              arriveBy={arriveBy}
              reason={reason}
              hasHome={Boolean(profile.homeAddress?.trim())}
              changedFrom={(choice?.extraMinutes ?? 0) > 0 && baseLeaveBy ? baseLeaveBy : undefined}
            />

            <ParkingCard parking={parking} campusMode={mode} />
          </>
        ) : events.length === 0 ? (
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
        ) : null}

        <Timeline
          events={events}
          legs={displayLegs}
          homeTrip={driving ? { walkMinutes: walkToCarMinutes, driveMinutes } : undefined}
          campusMode={mode}
          onEdit={setEditing}
          onDelete={deleteEvent}
          hiddenCount={schedule.hiddenCount}
          onRestore={() => schedule.saveHidden([])}
          affected={null}
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
