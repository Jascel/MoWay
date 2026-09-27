import { TriangleAlert, X } from "lucide-react";
import type { DerivedAlert } from "@/lib/alerts";

// "Your day changed" banner. It only displays; the Today page decides when to show it.
// If there is no alert, it shows a small "Reset demo" link so you can bring the banner back.
export default function DayAlert({
  alert,
  onDismiss,
  onReset,
}: {
  alert: DerivedAlert | null;
  onDismiss: () => void;
  onReset?: () => void;
}) {
  if (!alert) {
    if (!onReset) return null;
    return (
      <button onClick={onReset} className="text-xs text-ink/40 underline">
        Reset demo alert
      </button>
    );
  }
  return (
    <div
      key={alert.identity ?? alert.reportId}
      role="status"
      aria-live="polite"
      className="animate-slide-in rounded-3xl bg-blush p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
          <TriangleAlert className="size-5" />
          {alert.status === "cleared" ? "Route cleared" : alert.status === "unaffected" ? "Route updated" : "Your day changed"}
        </p>
        <button onClick={onDismiss} aria-label="Dismiss" className="rounded-full bg-white/60 p-1">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-sm">{alert.message}</p>
      {alert.extraMinutes > 0 && (
        <p className="mt-1 text-xs text-ink/70">
          We moved your leave-by time {alert.extraMinutes} min earlier.
        </p>
      )}
    </div>
  );
}
