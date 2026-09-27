"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { categoryStyles } from "@/lib/categories";
import { getScheduleForDate } from "@/lib/database/schedule";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { EventCategory } from "@/data/mock";
import { formatTime } from "@/lib/time";
import { useAuthUser } from "@/lib/useAuthUser";

type ScheduleRow = Awaited<ReturnType<typeof getScheduleForDate>>[number];

type CalendarDay = {
  readonly date: Date;
  readonly dateKey: string;
  readonly inMonth: boolean;
};

type CalendarConnectionState = {
  readonly userId: string;
  readonly connected: boolean;
  readonly connectedAt?: string | null;
  readonly error?: string;
};

type CalendarConnectionResponse = {
  readonly connected?: boolean;
  readonly connectedAt?: string | null;
  readonly authorizationUrl?: string;
  readonly error?: string;
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
    start: row.start_time,
    end: row.end_time,
    category: row.category as EventCategory,
    building: row.building,
    ...(row.room ? { room: row.room } : {}),
  };
}

export default function CalendarPage() {
  const { loading: authLoading, user } = useAuthUser();
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleResult, setScheduleResult] = useState<{
    readonly date: string;
    readonly events: CalendarEvent[];
    readonly error?: string;
  } | null>(null);
  const [calendarConnection, setCalendarConnection] =
    useState<CalendarConnectionState | null>(null);
  const [calendarAction, setCalendarAction] = useState<"connect" | "disconnect" | null>(null);
  const [calendarConnectionMessage, setCalendarConnectionMessage] = useState("");

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
          setCalendarConnection({
            userId,
            connected: result.connected === true,
            connectedAt: result.connectedAt,
          });
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
    if (!selectedDate) {
      return;
    }

    let isCurrent = true;
    getScheduleForDate(selectedDate)
      .then((rows) => {
        if (isCurrent) {
          setScheduleResult({
            date: selectedDate,
            events: rows.map(toCalendarEvent),
          });
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setScheduleResult({
            date: selectedDate,
            events: [],
            error:
              loadError instanceof Error
                ? loadError.message
                : "Could not load this day's schedule.",
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedDate]);

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
  const selectedResult = scheduleResult?.date === selectedDate
    ? scheduleResult
    : null;
  const events = selectedResult?.events ?? [];
  const loading = selectedDate !== null && selectedResult === null;
  const error = selectedResult?.error ?? "";

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
                    aria-label={date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    className={`mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm font-semibold transition-colors ${
                      isSelected
                        ? `bg-ink text-white ${isToday ? "ring-2 ring-leaf ring-offset-2" : ""}`
                        : isToday
                          ? "bg-mint text-leaf ring-1 ring-leaf"
                          : inMonth
                            ? "text-ink hover:bg-cream"
                            : "text-ink/25 hover:bg-cream"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold">{selectedDateLabel}</h2>
            {!loading && (
              <span className="text-xs font-medium text-ink/55">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {loading ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-ink/60">
              Loading schedule...
            </p>
          ) : error ? (
            <p className="rounded-2xl bg-white p-4 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => {
                const style = event.category
                  ? categoryStyles[event.category]
                  : categoryStyles.class;
                return (
                  <article key={event.id} className={`rounded-2xl p-4 ${style.bg}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </p>
                      <span className="text-xs font-semibold">{style.label}</span>
                    </div>
                    <h3 className="mt-1 font-bold text-ink">{event.title}</h3>
                    {event.building && (
                      <p className="mt-1 text-sm text-ink/70">
                        {event.building}
                        {event.room ? ` ${event.room}` : ""}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm text-ink/60">
              No MoWay events on this day.
            </div>
          )}
        </section>
      </main>
    </>
  );
}