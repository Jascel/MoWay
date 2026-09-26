"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import { modeOptions, prefOptions, PROFILE_KEY } from "@/lib/options";
import { ONBOARDED_KEY } from "@/lib/onboarding";
import { useStoredState } from "@/lib/useStoredState";
import { mockProfile, type Mode, type Profile } from "@/data/mock";

// First-time welcome: 0 = splash, 1 = name + how you get around, 2 = comfort preferences.
// Nothing is saved until the last button, then the answers become the saved Profile.
export default function Welcome({ initialStep = 0 }: { initialStep?: number }) {
  const router = useRouter();
  const [, saveProfile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);
  const [, saveOnboarded] = useStoredState<boolean>(ONBOARDED_KEY, false);

  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState("");
  const [home, setHome] = useState("");
  const [modes, setModes] = useState<Mode[]>(["walking"]);
  const [prefs, setPrefs] = useState<Profile["prefs"]>([]);

  function toggleMode(value: string) {
    const v = value as Mode;
    const next = modes.includes(v) ? modes.filter((m) => m !== v) : [...modes, v];
    if (next.length > 0) setModes(next); // keep at least one
  }

  function togglePref(value: string) {
    const v = value as Profile["prefs"][number];
    setPrefs(prefs.includes(v) ? prefs.filter((p) => p !== v) : [...prefs, v]);
  }

  function finish() {
    saveProfile({
      ...mockProfile,
      name: name.trim() || "Friend",
      homeAddress: home.trim(),
      modes,
      activeMode: modes[0],
      prefs,
    });
    saveOnboarded(true);
    router.push("/");
  }

  const nextButton = "w-full rounded-full bg-ink py-3.5 font-semibold text-white active:bg-ink/80";
  const backButton = "w-full py-2 text-sm font-medium text-ink/60";

  if (step === 0) {
    return (
      <div className="-mb-28 flex min-h-screen flex-col items-center justify-center bg-usf-green px-8 text-center text-white">
        <LogoMark size={128} />
        <h1 className="mt-6 font-logo text-5xl">MoWay</h1>
        <p className="mt-3 max-w-xs text-white/80">
          Your day on campus, planned around how you get around.
        </p>
        <button
          onClick={() => setStep(1)}
          className="mt-10 w-full max-w-xs rounded-full bg-white py-3.5 font-semibold text-ink"
        >
          Get started
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <>
        <PageHeader title="Welcome!" subtitle="Step 1 of 2" tone="mint" />
        <div className="-mt-6 space-y-6 px-4">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <label htmlFor="name" className="mb-2 block font-display text-lg font-bold">
              What should we call you?
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
            />
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <label htmlFor="home" className="mb-1 block font-display text-lg font-bold">
              Where do you live? <span className="text-sm font-normal text-ink/50">(optional)</span>
            </label>
            <p className="mb-3 text-xs text-ink/70">
              So we can work out your drive to campus. Saved only on this device.
            </p>
            <input
              id="home"
              value={home}
              onChange={(e) => setHome(e.target.value)}
              placeholder="Street address, city"
              autoComplete="street-address"
              className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
            />
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold">How do you get around?</h2>
            <p className="mb-3 text-xs text-ink/70">Pick all that apply. You can change this later.</p>
            <ChipGroup options={modeOptions} selected={modes} onToggle={toggleMode} />
          </section>

          <div className="space-y-1">
            <button onClick={() => setStep(2)} className={nextButton}>Next</button>
            <button onClick={() => setStep(0)} className={backButton}>Back</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="What matters to you?" subtitle="Step 2 of 2" tone="aqua" />
      <div className="-mt-6 space-y-6 px-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold">Comfort and access</h2>
          <p className="mb-3 text-xs text-ink/70">We&apos;ll plan your routes around these. Skip any you don&apos;t need.</p>
          <ChipGroup options={prefOptions} selected={prefs} onToggle={togglePref} />
        </section>

        <div className="space-y-1">
          <button onClick={finish} className={nextButton}>Let&apos;s go</button>
          <button onClick={() => setStep(1)} className={backButton}>Back</button>
        </div>
      </div>
    </>
  );
}
