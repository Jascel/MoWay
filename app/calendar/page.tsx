"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { categoryStyles } from "@/lib/categories";
import { getScheduleForDateRange } from "@/lib/database/schedule";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { EventCategory } from "@/data/mock";
import { formatTime } from "@/lib/time";
import { useAuthUser } from "@/lib/useAuthUser";

type ScheduleRow = Awaited<ReturnType<typeof getScheduleForDateRange>>[number];

type CalendarDay = {
  readonly date: Date;
  readonly dateKey: string;
  readonly inMonth: boolean;
};

type CalendarConnectionState = {
  readonly userId: string;
  readonly connected: boolean;
  readonly connectedAt?: string | null;
  readonly reconnectRequired?: boolean;
  readonly error?: string;
};

type CalendarConnectionResponse = {
  readonly connected?: boolean;
  readonly connectedAt?: string | null;
  readonly authorizationUrl?: string;
  readonly error?: string;
};

type CalendarEventsResponse = {
  readonly events?: CalendarEvent[];
  readonly connected?: boolean;
  readonly reconnectRequired?: boolean;
  readonly error?: string;
};

type CalendarRangeData = {
  readonly key: string;
  readonly mowayEvents: CalendarEvent[];
  readonly googleEvents: CalendarEvent[];
  readonly mowayLoading: boolean;
  readonly googleLoading: boolean;
  readonly mowayError?: string;
  readonly googleError?: string;
  readonly reconnectRequired: boolean;
};

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateForKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey: string, days: number): Date {
  const date = dateForKey(dateKey);
  date.setDate(date.getDate() + days);
  return date;
}

function localMidnightIso(dateKey: string): string {
  return dateForKey(dateKey).toISOString();
}

function monthDays(month: Date): CalendarDay[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const leadingDays = firstOfMonth.getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      month.getFullYear(),
      month.getMonth(),
      index - leadingDays + 1
    );
    return {
      date,
      dateKey: localDateKey(date),
      inMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function toCalendarEvent(row: ScheduleRow): CalendarEvent {
  return {
    id: `moway:${row.id}`,
    source: "moway",
    title: row.title,
    date: row.event_date,
    allDay: false,
    start: row.start_time,
    end: row.end_time,
    category: row.category as EventCategory,
    building: row.building,
    ...(row.room ? { room: row.room } : {}),
  };
}

function eventOccursOnDate(event: CalendarEvent, dateKey: string): boolean {
  if (!event.allDay) {
    return event.date === dateKey;
  }
  const endDate = event.endDate ?? localDateKey(addDays(event.date, 1));
  return event.date <= dateKey && dateKey < endDate;
}

export default function CalendarPage() {
  const { loading: authLoading, user } = useAuthUser();
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeData, setRangeData] = useState<CalendarRangeData | null>(null);
  const [calendarConnection, setCalendarConnection] =
    useState<CalendarConnectionState | null>(null);
  const [calendarAction, setCalendarAction] = useState<"connect" | "disconnect" | null>(null);
  const [calendarConnectionMessage, setCalendarConnectionMessage] = useState("");
  const userId = user?.id;
  const isAnonymous = user?.is_anonymous ?? false;

  const visibleDays = viewMonth ? monthDays(viewMonth) : [];
  const rangeStart = visibleDays[0]?.dateKey ?? null;
  const lastVisibleDay = visibleDays[visibleDays.length - 1];
  const rangeEndExclusive = lastVisibleDay
    ? localDateKey(addDays(lastVisibleDay.dateKey, 1))
    : null;
  const rangeKey = rangeStart && rangeEndExclusive
    ? `${userId ?? "no-user"}:${rangeStart}:${rangeEndExclusive}`
    : null;

  useEffect(() => {
    if (authLoading || !user || user.is_anonymous) {
      return;
    }

    const userId = user.id;
    let isCurrent = true;
    async function loadConnectionStatus(): Promise<void> {
      try {
        const {
          data: { session },
        } = await getSupabaseClient().auth.getSession();
        if (!session) {
          throw new Error("Your MoWay session has expired. Sign in again.");
        }

        const response = await fetch("/api/calendar/status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const result = (await response.json()) as CalendarConnectionResponse;
        if (!response.ok) {
          throw new Error(result.error || "Could not check Google Calendar status.");
        }
        if (isCurrent) {
          setCalendarConnection((current) => ({
            userId,
            connected: result.connected === true,
            connectedAt: result.connectedAt,
            reconnectRequired:
              current?.userId === userId && current.reconnectRequired === true,
          }));
        }
      } catch (statusError) {
        if (isCurrent) {
          setCalendarConnection({
            userId,
            connected: false,
            error:
              statusError instanceof Error
                ? statusError.message
                : "Could not check Google Calendar status.",
          });
        }
      }
    }

    void loadConnectionStatus();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const today = new Date();
      const todayDateKey = localDateKey(today);
      setTodayKey(todayDateKey);
      setSelectedDate(todayDateKey);
      setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!rangeStart || !rangeEndExclusive || !rangeKey || authLoading) {
      return;
    }

    const requestStart = rangeStart;
    const requestEnd = rangeEndExclusive;
    const requestKey = rangeKey;
    let isCurrent = true;
    const baseRangeData = (): CalendarRangeData => ({
      key: requestKey,
      mowayEvents: [],
      googleEvents: [],
      mowayLoading: true,
      googleLoading: true,
      reconnectRequired: false,
    });
    const updateRangeData = (
      update: Partial<CalendarRangeData>,
    ): void => {
      if (!isCurrent) {
        return;
      }
      setRangeData((current) => ({
        ...(current?.key === requestKey ? current : baseRangeData()),
        ...update,
      }));
    };

    void getScheduleForDateRange(requestStart, requestEnd)
      .then((rows) => {
        updateRangeData({
          mowayEvents: rows.map(toCalendarEvent),
          mowayLoading: false,
          mowayError: undefined,
        });
      })
      .catch((loadError: unknown) => {
        updateRangeData({
          mowayEvents: [],
          mowayLoading: false,
          mowayError: loadError instanceof Error
            ? loadError.message
            : "Could not load MoWay schedule events.",
        });
      });

    async function loadGoogleEvents(): Promise<void> {
      if (!userId || isAnonymous) {
        updateRangeData({
          googleEvents: [],
          googleLoading: false,
          googleError: undefined,
          reconnectRequired: false,
        });
        return;
      }

      try {
        const {
          data: { session },
        } = await getSupabaseClient().auth.getSession();
        if (!session) {
          throw new Error("Your MoWay session has expired. Sign in again.");
        }

        const search = new URLSearchParams({
          timeMin: localMidnightIso(requestStart),
          timeMax: localMidnightIso(requestEnd),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
        const response = await fetch(`/api/calendar/events?${search}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const result = (await response.json()) as CalendarEventsResponse;
        if (!response.ok) {
          throw new Error(result.error || "Could not load Google Calendar events.");
        }

        updateRangeData({
          googleEvents: result.events ?? [],
          googleLoading: false,
          googleError: undefined,
          reconnectRequired: result.reconnectRequired === true,
        });
        if (isCurrent) {
          setCalendarConnection((current) => ({
            userId,
            connected: result.reconnectRequired ? true : result.connected === true,
            reconnectRequired: result.reconnectRequired === true,
            ...(current?.userId === userId && current.connectedAt
              ? { connectedAt: current.connectedAt }
              : {}),
          }));
        }
      } catch (loadError) {
        updateRangeData({
          googleEvents: [],
          googleLoading: false,
          googleError: loadError instanceof Error
            ? loadError.message
            : "Could not load Google Calendar events.",
        });
      }
    }

    void loadGoogleEvents();

    return () => {
      isCurrent = false;
    };
  }, [authLoading, isAnonymous, rangeEndExclusive, rangeKey, rangeStart, userId]);

  function shiftMonth(offset: number): void {
    if (!viewMonth) {
      return;
    }
    const nextMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + offset,
      1
    );
    setViewMonth(nextMonth);
    setSelectedDate(localDateKey(nextMonth));
  }

  async function handleCalendarConnect(): Promise<void> {
    if (!user || user.is_anonymous) {
      return;
    }
    setCalendarAction("connect");
    setCalendarConnectionMessage("");
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      if (!session) {
        throw new Error("Your MoWay session has expired. Sign in again.");
      }

      const response = await fetch("/api/calendar/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as CalendarConnectionResponse;
      if (!response.ok || !result.authorizationUrl) {
        throw new Error(result.error || "Could not start Google Calendar connection.");
      }

      window.location.assign(result.authorizationUrl);
    } catch (connectError) {
      setCalendarConnectionMessage(
        connectError instanceof Error
          ? connectError.message
          : "Could not connect Google Calendar. Please try again."
      );
      setCalendarAction(null);
    }
  }

  async function handleCalendarDisconnect(): Promise<void> {
    if (!user || user.is_anonymous) {
      return;
    }
    setCalendarAction("disconnect");
    setCalendarConnectionMessage("");
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      if (!session) {
        throw new Error("Your MoWay session has expired. Sign in again.");
      }

      const response = await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as CalendarConnectionResponse;
      if (!response.ok) {
        throw new Error(result.error || "Could not disconnect Google Calendar.");
      }

      setCalendarConnection({ userId: user.id, connected: false });
      setCalendarConnectionMessage("Google Calendar disconnected.");
    } catch (disconnectError) {
      setCalendarConnectionMessage(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Could not disconnect Google Calendar. Please try again."
      );
    } finally {
      setCalendarAction(null);
    }
  }

  const selectedDateLabel = selectedDate
    ? dateForKey(selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Selected day";
  const currentRangeData = rangeData?.key === rangeKey ? rangeData : null;
  const visibleEvents = currentRangeData
    ? [...currentRangeData.mowayEvents, ...currentRangeData.googleEvents]
    : [];
  const events = selectedDate
    ? visibleEvents.filter((event) => eventOccursOnDate(event, selectedDate))
    : [];
  events.sort((left, right) => {
    if (left.allDay !== right.allDay) {
      return left.allDay ? -1 : 1;
    }
    return (left.start ?? "").localeCompare(right.start ?? "");
  });
  const loading = rangeKey !== null && (
    currentRangeData === null || currentRangeData.mowayLoading
  );
  const mowayError = currentRangeData?.mowayError ?? "";
  const googleError = currentRangeData?.googleError ?? "";

  return (
    <>
      <PageHeader title="Calendar" subtitle="Your MoWay schedule" tone="ice" />

      <main className="-mt-6 space-y-5 px-4 pb-4">
        <div className="flex justify-end">
          <Link
            href="/add"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="size-4" />
            Add event
          </Link>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-ink">Google Calendar</h2>
            {authLoading ? (
              <p className="mt-1 text-sm text-ink/60">Checking MoWay account...</p>
            ) : user?.is_anonymous ? (
              <p className="mt-1 text-sm text-ink/70">
                Create or sign into a MoWay account before connecting Google Calendar.
              </p>
            ) : !user ? (
              <p className="mt-1 text-sm text-ink/70">Sign into MoWay to manage a Calendar connection.</p>
            ) : calendarConnection?.userId !== user.id ? (
              <p className="mt-1 text-sm text-ink/60">Checking connection status...</p>
            ) : calendarConnection.error ? (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {calendarConnection.error}
              </p>
            ) : calendarConnection.reconnectRequired ? (
              <p className="mt-1 text-sm font-medium text-coral" role="alert">
                Google Calendar access expired. Reconnect to show its latest events.
              </p>
            ) : calendarConnection.connected ? (
              <p className="mt-1 text-sm text-leaf" role="status">
                Google Calendar connected. Access is read-only.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink/60">Not connected</p>
            )}
          </div>

          {user && !user.is_anonymous && calendarConnection?.userId === user.id && !calendarConnection.error && (
            calendarConnection.connected ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCalendarConnect()}
                  disabled={calendarAction !== null}
                  className="min-h-10 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
                >
                  {calendarAction === "connect" ? "Connecting..." : "Reconnect"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCalendarDisconnect()}
                  disabled={calendarAction !== null}
                  className="min-h-10 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {calendarAction === "disconnect" ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleCalendarConnect()}
                disabled={calendarAction !== null}
                className="min-h-10 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {calendarAction === "connect" ? "Connecting..." : "Connect Google Calendar"}
              </button>
            )
          )}
          {calendarConnectionMessage && (
            <p className="text-sm text-ink/70" role="status">
              {calendarConnectionMessage}
            </p>
          )}
        </section>

        <section
          className="rounded-3xl bg-white p-4 shadow-sm"
          aria-label="Month calendar"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={!viewMonth}
              aria-label="Previous month"
              className="grid size-10 place-items-center rounded-full text-ink hover:bg-cream disabled:opacity-40"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h2 className="font-display text-xl font-bold">
              {viewMonth
                ? viewMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "Loading calendar..."}
            </h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              disabled={!viewMonth}
              aria-label="Next month"
              className="grid size-10 place-items-center rounded-full text-ink hover:bg-cream disabled:opacity-40"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold text-ink/55">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="pb-2">
                {day}
              </span>
            ))}
          </div>

          {viewMonth && (
            <div className="grid grid-cols-7 gap-y-1">
              {monthDays(viewMonth).map(({ date, dateKey, inMonth }) => {
                const isToday = todayKey === dateKey;
                const isSelected = selectedDate === dateKey;
                const dateEvents = visibleEvents.filter((event) =>
                  eventOccursOnDate(event, dateKey)
                );
                const hasMoWayEvents = dateEvents.some((event) => event.source === "moway");
                const hasGoogleEvents = dateEvents.some((event) => event.source === "google");
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      if (!inMonth) {
                        setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                      }
                    }}
                    aria-label={`${date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}${dateEvents.length ? `, ${dateEvents.length} events` : ""}`}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    className={`mx-auto grid aspect-square w-full max-w-11 grid-rows-[1fr_6px] place-items-center rounded-full text-sm font-semibold transition-colors ${
                      isSelected
                        ? `bg-ink text-white ${isToday ? "ring-2 ring-leaf ring-offset-2" : ""}`
                        : isToday
                          ? "bg-mint text-leaf ring-1 ring-leaf"
                          : inMonth
                            ? "text-ink hover:bg-cream"
                            : "text-ink/25 hover:bg-cream"
                    }`}
                  >
                    <span className="self-end">{date.getDate()}</span>
                    <span className="flex h-1.5 items-center justify-center gap-1" aria-hidden="true">
                      {hasMoWayEvents && <span className="size-1.5 rounded-full bg-leaf" />}
                      {hasGoogleEvents && <span className="size-1.5 rounded-full bg-coral" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold">{selectedDateLabel}</h2>
            {!loading && !currentRangeData?.googleLoading && (
              <span className="text-xs font-medium text-ink/55">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {currentRangeData?.reconnectRequired && (
            <div className="flex flex-col gap-2 rounded-2xl border border-coral/30 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-ink">
                Google Calendar authorization needs renewal. MoWay events are still available.
              </p>
              <button
                type="button"
                onClick={() => void handleCalendarConnect()}
                disabled={calendarAction !== null}
                className="min-h-10 shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {calendarAction === "connect" ? "Reconnecting..." : "Reconnect Calendar"}
              </button>
            </div>
          )}

          {mowayError && (
            <p className="rounded-2xl bg-white p-4 text-sm font-medium text-red-600" role="alert">
              {mowayError}
            </p>
          )}
          {googleError && (
            <p className="rounded-2xl bg-white p-4 text-sm text-ink/70" role="status">
              Google Calendar events could not be loaded. Your MoWay events remain available.
            </p>
          )}

          {loading ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-ink/60">
              Loading MoWay schedule...
            </p>
          ) : currentRangeData?.googleLoading && events.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-ink/60">
              Loading Calendar events...
            </p>
          ) : events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => {
                const style = categoryStyles[event.category ?? "event"];
                const bg = event.source === "google" ? (event.color ?? "bg-aqua-soft") : style.bg;
                return (
                  <article key={event.id} className={`rounded-2xl p-4 ${bg}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">
                        {event.allDay
                          ? event.endDate && event.endDate > localDateKey(addDays(event.date, 1))
                            ? "All day · multi-day"
                            : "All day"
                          : event.start && event.end
                            ? `${formatTime(event.start)} - ${formatTime(event.end)}`
                            : "Time unavailable"}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {event.category && (
                          <span className="text-xs font-semibold">{style.label}</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          event.source === "google"
                            ? "bg-white/75 text-ink/65"
                            : "bg-white/75 text-leaf"
                        }`}>
                          {event.source === "google" ? "Google Calendar" : "MoWay"}
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-1 font-bold text-ink">{event.title}</h3>
                    {event.location && (
                      <p className="mt-1 text-sm text-ink/70">{event.location}</p>
                    )}
                    {event.building && (
                      <p className="mt-1 text-sm text-ink/70">
                        {event.source === "google" ? `USF building: ${event.building}` : event.building}
                        {event.room ? ` ${event.room}` : ""}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm text-ink/60">
              No events on this day.
            </div>
          )}
        </section>
      </main>
    </>
  );
}