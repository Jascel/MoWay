import { formatTime } from "@/lib/time";

// "Smart Commute": when to leave home. Props are plain values so it's easy to reuse.
export default function CommuteCard({
  leaveBy,
  driveMinutes,
  arriveBy,
  reason,
}: {
  leaveBy: string;
  driveMinutes: number;
  arriveBy: string;
  reason: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-usf-green">Smart Commute</p>
      <p className="mt-1 text-2xl font-bold">Leave home at {formatTime(leaveBy)}</p>
      <p className="mt-1 text-sm text-gray-600">
        {driveMinutes} min drive, arrive by {formatTime(arriveBy)}
      </p>
      <p className="mt-2 text-xs text-gray-500">{reason}</p>
    </section>
  );
}
