import { Footprints, SquareParking } from "lucide-react";
import type { ParkingRecommendation } from "@/data/mock";

// How full is the garage? Picks a friendly label and bar color from "% of spots left".
function fullness(spotsLeft: number) {
  if (spotsLeft > 50) return { text: "Plenty of spots", bar: "bg-leaf" };
  if (spotsLeft > 20) return { text: "Filling up, get there early", bar: "bg-amber-400" };
  return { text: "Almost full, hurry", bar: "bg-red-400" };
}

// "Smart Park": best garage for the WHOLE day.
export default function ParkingCard({ parking }: { parking: ParkingRecommendation }) {
  const status = fullness(parking.spotsLeftPercent);
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-leaf">Smart Park</p>
      <p className="mt-2 flex items-center gap-2 font-display text-xl font-bold leading-tight">
        <SquareParking className="size-6 shrink-0 text-leaf" />
        {parking.garage}
      </p>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-sm font-semibold">
        <Footprints className="size-4 text-leaf" />
        Saves you {parking.savesWalkMinutes} min of walking today
      </p>
      <p className="mt-3 text-xs text-ink/70">{parking.reason}</p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-mint">
        <div
          className={`h-full rounded-full ${status.bar}`}
          style={{ width: `${100 - parking.spotsLeftPercent}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-medium text-ink/80">
        {status.text} ({parking.spotsLeftPercent}% left)
      </p>
    </section>
  );
}
