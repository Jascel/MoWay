"use client";

import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import { useStoredState } from "@/lib/useStoredState";
import { modeOptions, prefOptions } from "@/lib/options";
import { mockProfile, type Profile } from "@/data/mock";

// Every change is saved right away (no Save button), under the key "moway.profile".
export default function ProfilePage() {
  const [profile, saveProfile] = useStoredState<Profile>("moway.profile", mockProfile);

  // Add the value if it's missing, remove it if it's there.
  function toggle<K extends "modes" | "prefs">(field: K, value: string) {
    const list = profile[field] as string[];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    saveProfile({ ...profile, [field]: next });
  }

  return (
    <>
      <PageHeader title="Profile" subtitle="How you get around" />
      <div className="space-y-6 p-4">
        <section>
          <label className="mb-2 block text-sm font-bold" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-xl border border-gray-300 bg-white p-3"
          />
        </section>

        <section>
          <h2 className="text-sm font-bold">How do you get around?</h2>
          <p className="mb-2 text-xs text-gray-500">Pick all that apply.</p>
          <ChipGroup
            options={modeOptions}
            selected={profile.modes}
            onToggle={(v) => toggle("modes", v)}
          />
        </section>

        <section>
          <h2 className="text-sm font-bold">Accessibility & comfort</h2>
          <p className="mb-2 text-xs text-gray-500">We&apos;ll plan routes around these.</p>
          <ChipGroup
            options={prefOptions}
            selected={profile.prefs}
            onToggle={(v) => toggle("prefs", v)}
          />
        </section>

        <section>
          <h2 className="text-sm font-bold">Parking buffer</h2>
          <p className="mb-2 text-xs text-gray-500">
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
              className="w-24 rounded-xl border border-gray-300 bg-white p-3"
            />
            <span className="text-sm text-gray-600">minutes</span>
          </div>
        </section>

        <p className="text-xs text-gray-400">Saved automatically on this device.</p>
      </div>
    </>
  );
}
