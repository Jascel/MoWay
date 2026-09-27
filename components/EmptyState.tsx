import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint-soft">
        <Icon className="size-7 text-leaf" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="font-display mt-3 text-xl font-bold">{title}</p>
      {text && <p className="mt-1 text-sm text-ink/60">{text}</p>}
    </div>
  );
}
