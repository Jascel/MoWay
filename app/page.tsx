import PageHeader from "@/components/PageHeader";
import { mockDay } from "@/data/mock";

export default function TodayPage() {
  return (
    <>
      <PageHeader title="Here's Your Day" subtitle={mockDay.date} />
      <p className="p-4 text-gray-600">
        Leave by {mockDay.leaveBy}. Full Today screen coming soon (Phase 2).
      </p>
    </>
  );
}
