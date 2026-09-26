"use client";

import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import ChipGroup from "@/components/ChipGroup";
import { useStoredState } from "@/lib/useStoredState";
import { modeOptions, prefOptions, PROFILE_KEY } from "@/lib/options";
import { mockProfile, type Mode, type Profile } from "@/data/mock";

// Every change is saved right away (no Save button), in the browser under PROFILE_KEY.
export default function ProfilePage() {
  const [profile, saveProfile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);

  // Add the value if it's missing, remove it if it's there.
  function toggle<K extends "modes" | "prefs">(field: K, value: string) {
    const list = profile[field] as string[];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    saveProfile({ ...profile, [field]: next });
  }

  // Adding/removing a way of getting around. The "active" one must always be one of them.
  function toggleMode(value: string) {
    const list = profile.modes as string[];
    const modes = (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]) as Mode[];
    if (modes.length === 0) return; // keep at least one
    const activeMode = modes.includes(profile.activeMode) ? profile.activeMode : modes[0];
    saveProfile({ ...profile, modes, activeMode });
  }

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="How you get around"
        tone="aqua"
        right={<Avatar name={profile.name} size="lg" />}
      />
      <div className="-mt-6 space-y-6 px-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-lg font-bold" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
          />
        </section>

        <section className="rounded-3xl bg-mint p-5">
          <h2 className="text-lg font-bold">How do you get around?</h2>
          <p className="mb-3 text-xs text-ink/70">Pick all that apply.</p>
          <ChipGroup
            options={modeOptions}
            selected={profile.modes}
            onToggle={toggleMode}
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Using today</h2>
          <p className="mb-3 text-xs text-ink/70">Which one are you using right now?</p>
          <ChipGroup
            options={modeOptions.filter((o) => profile.modes.includes(o.value))}
            selected={[profile.activeMode]}
            onToggle={(v) => saveProfile({ ...profile, activeMode: v as Mode })}
          />
        </section>

        <section className="rounded-3xl bg-aqua p-5">
          <h2 className="text-lg font-bold">Accessibility & comfort</h2>
          <p className="mb-3 text-xs text-ink/70">We&apos;ll plan routes around these.</p>
          <ChipGroup
            options={prefOptions}
            selected={profile.prefs}
            onToggle={(v) => toggle("prefs", v)}
          />
        </section>

        <section className="rounded-3xl bg-sun p-5">
          <h2 className="text-lg font-bold">Parking buffer</h2>
          <p className="mb-3 text-xs text-ink/70">
            Arrive this early before your first class so parking isn&apos;t stressful.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={90}
              value={profile.parkingBufferMinutes}
              onChange={(e) =>
                saveProfile({ ...profile, parkingBufferMinutes: Number(e.target.value) })
              }
              className="w-24 rounded-2xl border border-ink/15 bg-white p-3"
            />
            <span className="text-sm font-medium">minutes</span>
          </div>
        </section>

        <p className="pb-2 text-center text-xs text-ink/40">Saved automatically on this device.</p>
      </div>
    </>
  );
}
