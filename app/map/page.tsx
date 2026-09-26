import type { Metadata } from "next";

import { CampusMap } from "@/components/maps/campus-map";
import { CAMPUS_BUILDINGS } from "@/lib/maps/campus-buildings";

export const metadata: Metadata = {
  title: "USF Walking Map | MoWay",
  description:
    "Choose two USF Tampa buildings and view a Google walking route estimate.",
};

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-7 text-[#173b2b] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4d795c]">
              MoWay · USF Tampa
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
              Campus walking map
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#50705b]">
              Pick two campus buildings to see a Google walking route, distance,
              and estimated time.
            </p>
          </div>
          <span className="rounded-full bg-[#dcebdd] px-3 py-1.5 text-xs font-semibold text-[#28613d]">
            Walking directions
          </span>
        </header>

        <CampusMap apiKey={apiKey} mapId={mapId} buildings={CAMPUS_BUILDINGS} />
      </div>
    </main>
  );
}
