// Small helpers for "HH:MM" 24h strings. Everything else in the app uses these.

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// "14:05" -> "2:05 PM"
export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ("10:00", 8) -> "09:52"
export function minusMinutes(t: string, minutes: number): string {
  const total = toMinutes(t) - minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// "2026-09-25" -> "Fri"
export function weekdayShort(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}
