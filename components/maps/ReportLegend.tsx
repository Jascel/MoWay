import { pinColor } from "@/lib/maps/report-pins";
import { reportCategories } from "@/lib/reportCategories";

// Under the map: how many live reports there are, and what each pin color means.
export default function ReportLegend({ count }: { count: number }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm" aria-label="Report pin colors">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold">Live reports</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-leaf" />
          </span>
          Live
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/70">
        {count === 0
          ? "No reports around campus right now."
          : `${count} ${count === 1 ? "report" : "reports"} around campus. Tap a pin for details.`}
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {reportCategories.map((c) => (
          <li key={c.value} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: pinColor(c.value) }} />
            {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
