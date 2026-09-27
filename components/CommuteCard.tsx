import Link from "next/link";
import { Car, House } from "lucide-react";
import { formatTime } from "@/lib/time";
import AlertIcon from "@/components/AlertIcon";

// "Smart Commute": when to leave home. Props are plain values so it's easy to reuse.
export default function CommuteCard({
  leaveBy,
  driveMinutes,
  arriveBy,
  reason,
  hasHome,
  changedFrom,
}: {
  leaveBy: string;
  driveMinutes: number;
  arriveBy: string;
  reason: string;
  hasHome: boolean;
  changedFrom?: string; // the leave-by time before a report moved it
}) {
  // "8:40 AM" -> big "8:40" plus small "AM"
  const [time, suffix] = formatTime(leaveBy).split(" ");
  return (
    <section className="rounded-3xl bg-aqua p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-leaf">Smart Commute</p>
          <p className="mt-2 text-sm font-semibold text-ink/70">Leave home at</p>
          <p key={leaveBy} className="animate-pop font-display text-4xl font-bold leading-none">
            {time}
            <span className="ml-1.5 text-lg">{suffix}</span>
          </p>
          {changedFrom && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/70">
              <AlertIcon label="Changed by a report" />
              Moved earlier from <span className="line-through">{formatTime(changedFrom)}</span>
            </p>
          )}
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/60">
          <House className="size-5 text-leaf" />
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm font-medium">
        <Car className="size-4 text-leaf" />
        {driveMinutes} min drive, arrive by {formatTime(arriveBy)}
      </p>
      <p className="mt-2 text-xs text-ink/70">{reason}</p>
      <p className="mt-1 text-xs text-ink/70">
        {hasHome ? (
          "Driving from your home address."
        ) : (
          <Link href="/profile" className="underline">Add your home address</Link>
        )}
      </p>
    </section>
  );
}
