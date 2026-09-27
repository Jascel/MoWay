"use client";

import { useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import ChipGroup from "@/components/ChipGroup";
import { useStoredState } from "@/lib/useStoredState";
import { modeOptions, prefOptions, PROFILE_KEY } from "@/lib/options";
import { Car } from "lucide-react";
import { mockProfile, type Mode, type Profile } from "@/data/mock";
import { useDriveEstimate } from "@/lib/driveTime";
import { syncProfile } from "@/lib/syncProfile";
import { logOut } from "@/lib/auth";
import { useAuthUser } from "@/lib/useAuthUser";
import { photoToDataUrl } from "@/lib/photo";

// Every change is saved right away (no Save button), in the browser under PROFILE_KEY.
export default function ProfilePage() {
  const [profile, saveProfile] = useStoredState<Profile>(PROFILE_KEY, mockProfile);
  const drive = useDriveEstimate(profile.homeAddress ?? "");
  const { user } = useAuthUser();
  const accountEmail = user && !user.is_anonymous ? user.email : null;

  // Save to Supabase a moment after you stop making changes.
  const profileJson = JSON.stringify(profile);
  useEffect(() => {
    const timer = setTimeout(() => void syncProfile(JSON.parse(profileJson) as Profile), 1000);
    return () => clearTimeout(timer);
  }, [profileJson]);

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

  // Shrink the chosen picture and save it with the profile.
  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    try {
      saveProfile({ ...profile, photo: await photoToDataUrl(file) });
    } catch {
      alert("Sorry, that picture couldn't be used. Try a different one.");
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="How you get around"
        tone="aqua"
        right={<Avatar name={profile.name} photo={profile.photo} size="lg" />}
      />
      <div className="-mt-6 space-y-6 px-4">
        <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <Avatar name={profile.name} photo={profile.photo} size="lg" />
          <div>
            <p className="font-display text-lg font-bold">Profile photo</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label
                htmlFor="photo"
                className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white active:bg-ink/80"
              >
                {profile.photo ? "Change photo" : "Add a photo"}
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void choosePhoto(e.target.files?.[0]);
                  e.target.value = ""; // lets you pick the same picture again
                }}
              />
              {profile.photo && (
                <button
                  type="button"
                  onClick={() => saveProfile({ ...profile, photo: undefined })}
                  className="text-sm text-ink/60 underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-ink/60">Saved only on this device.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-mist p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold">Account</h2>
          {accountEmail ? (
            <>
              <p className="mt-1 break-all text-sm text-ink/70">Signed in as {accountEmail}</p>
              <button
                type="button"
                onClick={() => void logOut()}
                className="mt-3 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink/70">
                You&apos;re using MoWay as a guest. Create an account to keep your schedule and reports.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Create account or log in
              </Link>
            </>
          )}
        </section>

        <section className="rounded-3xl bg-mist p-5 shadow-sm">
          <label className="mb-2 block font-display text-lg font-bold" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
          />
        </section>

        <section className="rounded-3xl bg-mist p-5 shadow-sm">
          <label className="mb-1 block font-display text-lg font-bold" htmlFor="home">
            Where do you live?
          </label>
          <p className="mb-3 text-xs text-ink/70">
            We use it to work out your drive to campus. It&apos;s saved only on this device.
          </p>
          <input
            id="home"
            value={profile.homeAddress ?? ""}
            onChange={(e) => saveProfile({ ...profile, homeAddress: e.target.value })}
            placeholder="Street address, city"
            autoComplete="street-address"
            className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
          />
          {drive.status === "loading" && <p className="mt-3 text-sm text-ink/60">Working out your drive...</p>}
          {drive.status === "error" && (
            <p className="mt-3 text-sm text-red-600">Couldn&apos;t find that address. Try adding the street and city.</p>
          )}
          {drive.minutes !== null && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium">
              <Car className="size-4 text-leaf" />
              About {drive.minutes} min to campus ({drive.miles?.toFixed(1)} mi, without traffic)
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-mint p-5">
          <h2 className="font-display text-lg font-bold">How do you get around?</h2>
          <p className="mb-3 text-xs text-ink/70">Pick all that apply.</p>
          <ChipGroup
            options={modeOptions}
            selected={profile.modes}
            onToggle={toggleMode}
          />
        </section>

        <section className="rounded-3xl bg-sand p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold">Using today</h2>
          <p className="mb-3 text-xs text-ink/70">Which one are you using right now?</p>
          <ChipGroup
            options={modeOptions.filter((o) => profile.modes.includes(o.value))}
            selected={[profile.activeMode]}
            onToggle={(v) => saveProfile({ ...profile, activeMode: v as Mode })}
          />
        </section>

        <section className="rounded-3xl bg-aqua p-5">
          <h2 className="font-display text-lg font-bold">Accessibility & comfort</h2>
          <p className="mb-3 text-xs text-ink/70">We&apos;ll plan routes around these.</p>
          <ChipGroup
            options={prefOptions}
            selected={profile.prefs}
            onToggle={(v) => toggle("prefs", v)}
          />
        </section>

        <section className="rounded-3xl bg-sun p-5">
          <h2 className="font-display text-lg font-bold">Parking buffer</h2>
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

        <p className="text-center text-xs text-ink/40">Saved automatically on this device.</p>
        <p className="pb-2 text-center text-xs">
          <Link href="/welcome" className="text-ink/50 underline">Replay the welcome screens</Link>
        </p>
      </div>
    </>
  );
}
