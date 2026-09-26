// A row of tappable "chips". Tapping one calls onToggle(value); the parent decides
// what that means (add/remove for multi-select, or just replace for single choice).
// `selected` is the list of currently-chosen values, shown in green.
export default function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string; icon?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`rounded-full border px-3 py-2 text-sm font-medium ${
              on
                ? "border-usf-green bg-usf-green text-white"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            {o.icon && <span className="mr-1">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
