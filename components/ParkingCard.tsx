import type { ParkingRecommendation } from "@/data/mock";

// "Smart Park": best garage for the WHOLE day. The green bar shows how full the garage is.
export default function ParkingCard({ parking }: { parking: ParkingRecommendation }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-usf-green">Smart Park</p>
      <p className="mt-1 text-2xl font-bold">🅿️ {parking.garage}</p>
      <p className="mt-1 text-sm text-gray-600">
        Saves {parking.savesWalkMinutes} min of walking today
      </p>
      <p className="mt-2 text-xs text-gray-500">{parking.reason}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-usf-green"
          style={{ width: `${100 - parking.spotsLeftPercent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">{parking.spotsLeftPercent}% of spots left</p>
    </section>
  );
}
