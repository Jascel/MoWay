export default function ThankYou() {
  return (
    <section
      role="status"
      className="animate-fade-up flex items-center gap-4 rounded-3xl bg-mint p-5 shadow-sm"
    >
      <span className="animate-badge flex size-14 shrink-0 items-center justify-center rounded-full bg-white">
        <svg viewBox="0 0 24 24" className="size-8 text-leaf" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path className="animate-draw" d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <div>
        <p className="font-display text-xl font-bold leading-tight">You just helped people on campus</p>
        <p className="mt-0.5 text-sm text-ink/70">Other people&apos;s routes will update.</p>
      </div>
    </section>
  );
}
