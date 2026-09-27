import { TriangleAlert } from "lucide-react";

// A tiny alert triangle in a pale red circle. Marks anything a report has changed.
export default function AlertIcon({ label = "Changed by a report" }: { label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-rose"
    >
      <TriangleAlert className="size-3 text-red-600" strokeWidth={2.5} />
    </span>
  );
}
