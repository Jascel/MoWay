// Small "why this route" tags like "+3 min" or "More shaded".
// Tags starting with "+" are amber (it costs you time); everything else is green.
export default function RouteChips({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tag.startsWith("+") ? "bg-warn-light text-warn" : "bg-usf-green-light text-usf-green-dark"
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
