import type { EventCategory } from "@/data/mock";

export type CalendarEventSource = "moway" | "google";

/** UI model for combining persisted MoWay rows with read-only Google events. */
export type CalendarEvent = {
  /** Source-prefixed ID, such as `moway:<row-id>` or `google:<occurrence-id>`. */
  readonly id: string;
  readonly source: CalendarEventSource;
  readonly title: string;
  readonly date: string;
  readonly allDay: boolean;
  readonly start?: string;
  readonly end?: string;
  /** Exclusive end date for multi-day Google all-day events. */
  readonly endDate?: string;
  readonly category?: EventCategory;
  readonly building?: string;
  readonly room?: string;
  /** Original external location text; Google data remains unmodified. */
  readonly location?: string;
};