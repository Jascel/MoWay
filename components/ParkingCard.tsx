import type { ParkingRecommendation } from "@/data/mock";

// How full is the garage? Picks a friendly label and bar color from "% of spots left".
function fullness(spotsLeft: number) {
  if (spotsLeft > 50) return { text: "Plenty of spots 🎉", bar: "bg-emerald-500" };
  if (spotsLeft > 20) return { text: "Filling up, get there early ⏰", bar: "bg-amber-400" };
  return { text: "Almost full, hurry! 🏃", bar: "bg-red-500" };
}

// "Smart Park": best garage for the WHOLE day.
export default function ParkingCard({ parking }: { parking: ParkingRecommendation }) {
  const status = fullness(parking.spotsLeftPercent);
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-usf-green">Smart Park</p>
      <p className="mt-1 text-2xl font-bold">🅿️ {parking.garage}</p>
      <p className="mt-2 inline-block rounded-full bg-usf-green-light px-3 py-1 text-sm font-medium text-usf-green-dark">
        🚶💨 Saves you {parking.savesWalkMinutes} min of walking today
      </p>
      <p className="mt-3 text-xs text-gray-500">{parking.reason}</p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${status.bar}`}
          style={{ width: `${100 - parking.spotsLeftPercent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-600">
        {status.text} ({parking.spotsLeftPercent}% left)
      </p>
    </section>
  );
}
