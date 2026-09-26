import type { RouteAlert } from "@/data/mock";

// "Your day changed" banner. It only displays; the Today page decides when to show it.
// If there is no alert, it shows a small "Reset demo" link so you can bring the banner back.
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
      <button onClick={onReset} className="text-xs text-gray-400 underline">
        Reset demo alert
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-yellow-300 bg-warn-light p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-warn">⚠️ Your day changed</p>
        <button onClick={onDismiss} aria-label="Dismiss" className="text-gray-500">
          ✕
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-800">{alert.message}</p>
      <p className="mt-1 text-xs text-gray-600">
        We moved your leave-by time {alert.extraMinutes} min earlier.
      </p>
    </div>
  );
}
