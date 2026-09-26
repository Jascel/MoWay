import PageHeader from "@/components/PageHeader";
import { CampusMap } from "@/components/maps/campus-map";
import { CAMPUS_BUILDINGS } from "@/lib/maps/campus-buildings";

const DEFAULT_GOOGLE_MAP_ID = "DEMO_MAP_ID";

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_GOOGLE_MAP_ID;

  return (
    <>
      <PageHeader
        title="Map"
        subtitle="Walking directions around USF Tampa"
        tone="ice"
      />
      <div className="-mt-6 space-y-6 px-4 pb-4">
        <CampusMap apiKey={apiKey} mapId={mapId} buildings={CAMPUS_BUILDINGS} />
      </div>
    </>
  );
}
