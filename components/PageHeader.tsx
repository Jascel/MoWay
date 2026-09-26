// A reusable green header. `title` and `subtitle` are "props": inputs the parent passes in.
export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="bg-usf-green px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-white">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
    </header>
  );
}
