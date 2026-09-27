export default function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 rounded-3xl bg-white p-5 shadow-sm" aria-hidden>
      <div className="h-3 w-24 rounded-full bg-ink/10" />
      <div className="h-6 w-2/3 rounded-full bg-ink/10" />
      <div className="h-3 w-1/2 rounded-full bg-ink/10" />
      <div className="flex gap-3 pt-2">
        <div className="h-11 flex-1 rounded-full bg-ink/10" />
        <div className="h-11 flex-1 rounded-full bg-ink/10" />
      </div>
    </div>
  );
}
