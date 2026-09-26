import type { LucideIcon } from "lucide-react";

// A row of tappable "chips". Tapping one calls onToggle(value); the parent decides
// what that means (add/remove for multi-select, or just replace for single choice).
// `selected` is the list of currently-chosen values, shown in dark green.
export default function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string; icon?: LucideIcon }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label, icon: Icon }) => {
        const on = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${
              on
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink"
            }`}
          >
            {Icon && <Icon className="size-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
