import { BellRing, TriangleAlert, X } from "lucide-react";
import type { RouteAlert } from "@/data/mock";

// "Your day changed" banner. It only displays; the Today page decides when to show it.
// If there is no alert, it shows a small bell button that brings the banner back.
export default function DayAlert({
  alert,
  onDismiss,
  onReset,
}: {
  alert: RouteAlert | null;
  onDismiss: () => void;
  onReset: () => void;
}) {
  if (!alert) {
    return (
      <div className="flex justify-end pt-3">
        <button
          onClick={onReset}
          aria-label="Show my day alert again"
          title="Show my day alert again"
          className="flex size-9 items-center justify-center rounded-full bg-white text-leaf shadow-sm"
        >
          <BellRing className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <div
      key={alert.reportId}
      role="status"
      aria-live="polite"
      className="animate-slide-in rounded-3xl bg-blush p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
          <TriangleAlert className="size-5" />
          Your day changed
        </p>
        <button onClick={onDismiss} aria-label="Dismiss" className="rounded-full bg-white/60 p-1">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-sm">{alert.message}</p>
      <p className="mt-1 text-xs text-ink/70">
        We moved your leave-by time {alert.extraMinutes} min earlier.
      </p>
    </div>
  );
}
