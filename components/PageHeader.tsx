// Big colored header with a rounded bottom edge. `tone` picks the color block,
// `right` is an optional spot for something on the right (like the avatar).
const tones = {
  mint: "bg-mint",
  aqua: "bg-aqua",
  sun: "bg-sun",
  blush: "bg-blush",
};

export default function PageHeader({
  title,
  subtitle,
  tone = "mint",
  right,
}: {
  title: string;
  subtitle?: string;
  tone?: keyof typeof tones;
  right?: React.ReactNode;
}) {
  return (
    <header
      className={`${tones[tone]} rounded-b-[2.5rem] px-5 pb-14 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-ink`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm font-medium text-ink/70">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
