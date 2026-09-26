import PageHeader from "@/components/PageHeader";
import MapPreview from "@/components/MapPreview";
import RoutePanel from "@/components/RoutePanel";
import { mockDay } from "@/data/mock";

// TEMPORARY preview so we can see the route panel without touching app/map (Andres's page).
// Delete this folder once the real /map page uses <RoutePanel />.
export default function RoutePreviewPage() {
  return (
    <>
      <PageHeader title="Map" subtitle="Preview of the route panel" tone="aqua" />
      <div className="-mt-6 space-y-6 px-4">
        <MapPreview from="Zimmerman" to="CIS 1045" />
        <RoutePanel day={mockDay} />
      </div>
    </>
  );
}
