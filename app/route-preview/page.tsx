import PageHeader from "@/components/PageHeader";
import RoutePanel from "@/components/RoutePanel";
import { mockDay } from "@/data/mock";

// TEMPORARY preview so we can see the route panel without touching app/map (Andres's page).
// Delete this folder once the real /map page uses <RoutePanel />.
export default function RoutePreviewPage() {
  return (
    <>
      <PageHeader title="Map (preview)" subtitle="Route info panel demo" />
      <div className="space-y-4 p-4">
        <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 text-center text-sm text-gray-500">
          Andres&apos;s campus map goes here
        </div>
        <RoutePanel day={mockDay} />
      </div>
    </>
  );
}
