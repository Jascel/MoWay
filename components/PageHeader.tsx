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
  large = false,
  brand = false,
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: keyof typeof tones;
  right?: React.ReactNode;
  brand?: boolean; // show the "MoWay" wordmark row at the very top, like an app logo bar
  large?: boolean; // bigger title (used for the greeting on Today)
  children?: React.ReactNode; // extra content shown inside the colored header, under the title
}) {
  return (
    <header
      className={`${tones[tone]} rounded-b-[2.5rem] px-5 pb-14 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-ink`}
    >
      {brand && (
        <div className="mb-5 flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-tight">MoWay</span>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-usf-green px-2 py-1 text-[11px] font-bold tracking-wider text-usf-gold">
              USF
            </span>
            {right}
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className={`font-display font-bold leading-tight tracking-tight ${large ? "text-5xl" : "text-4xl"}`}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm font-medium text-ink/70">{subtitle}</p>}
        </div>
        {!brand && right}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}
