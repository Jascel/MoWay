// A small pulsing green dot with "Live": shows that reports update on their own.
export default function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-leaf" />
      </span>
      Live
    </span>
  );
}
