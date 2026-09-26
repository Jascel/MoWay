import { notFound } from "next/navigation";

import PageHeader from "@/components/PageHeader";
import { CampusLocationsTool } from "@/components/dev/campus-locations-tool";
import { CAMPUS_BUILDINGS } from "@/lib/maps/campus-buildings";
import { CAMPUS_GARAGES } from "@/lib/maps/campus-parking";

const DEFAULT_GOOGLE_MAP_ID = "DEMO_MAP_ID";

/**
 * Development-only tool: search Google for a campus place, pick the correct
 * result from the list, drag the pin to the accessible entrance, and save it
 * into data/campus-locations.json. Not available in production builds.
 */
export default function CampusLocationsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_GOOGLE_MAP_ID;

  return (
    <>
      <PageHeader
        title="Campus locations"
        subtitle="Dev tool: look up a place once, confirm it, save the coordinates"
        tone="sun"
      />
      <div className="-mt-6 space-y-6 px-4 pb-4">
        <CampusLocationsTool
          apiKey={apiKey}
          mapId={mapId}
          buildings={CAMPUS_BUILDINGS}
          garages={CAMPUS_GARAGES}
        />
      </div>
    </>
  );
}
