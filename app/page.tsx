export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f4f7f2] px-6 py-10 text-[#173b2b] sm:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-16">
        <header className="flex items-center justify-between">
          <p className="text-xl font-semibold tracking-tight">MoWay</p>
          <span className="rounded-full bg-[#dcebdd] px-3 py-1 text-xs font-medium text-[#28613d]">USF Tampa</span>
        </header>
        <section className="grid gap-10 pb-12 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-[#4d795c]">Your day, mapped better</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">Move through campus with a plan.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#50705b]">MoWay connects your schedule, mobility needs, parking, weather, and campus reports into one clear day plan.</p>
          </div>
          <div className="rounded-3xl border border-[#c9ddcc] bg-white/80 p-6 shadow-sm">
            <p className="text-sm font-medium text-[#4d795c]">Starter status</p>
            <div className="mt-5 space-y-4 text-sm">
              <p className="flex items-center justify-between border-b border-[#e4eee4] pb-3"><span>Next.js + TypeScript</span><span>Ready</span></p>
              <p className="flex items-center justify-between border-b border-[#e4eee4] pb-3"><span>Tailwind CSS</span><span>Ready</span></p>
              <p className="flex items-center justify-between"><span>Maps + Supabase</span><span className="text-[#6c8771]">Next up</span></p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
