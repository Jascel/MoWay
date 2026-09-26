import { Car } from "lucide-react";
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
  // "8:40 AM" -> big "8:40" plus small "AM"
  const [time, suffix] = formatTime(leaveBy).split(" ");
  return (
    <section className="rounded-3xl bg-aqua p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-leaf">Smart Commute</p>
      <p className="mt-2 text-sm font-semibold text-ink/70">Leave home at</p>
      <p className="font-display text-4xl font-bold leading-none">
        {time}
        <span className="ml-1.5 text-lg">{suffix}</span>
      </p>
      <p className="mt-3 flex items-center gap-2 text-sm font-medium">
        <Car className="size-4 text-leaf" />
        {driveMinutes} min drive, arrive by {formatTime(arriveBy)}
      </p>
      <p className="mt-2 text-xs text-ink/70">{reason}</p>
    </section>
  );
}
