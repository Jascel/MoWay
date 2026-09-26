// Small "why this route" tags like "+3 min" or "More shaded".
// Tags starting with "+" are yellow (it costs you time); everything else is green.
export default function RouteChips({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            tag.startsWith("+") ? "bg-sun text-ink" : "bg-mint text-ink"
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
