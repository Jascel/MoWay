"use client";

import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import { useStoredState } from "@/lib/useStoredState";
import { modeOptions, prefOptions } from "@/lib/options";
import { mockProfile, type Profile } from "@/data/mock";
import {
  saveMobilityProfile,
  type MobilityMode,
} from "@/lib/database/mobility";

export default function ProfilePage() {
  const [profile, saveProfile] = useStoredState<Profile>(
    "moway.profile",
    mockProfile
  );

  // Add or remove an option from the profile.
  function toggle<K extends "modes" | "prefs">(
    field: K,
    value: string
  ) {
    const list = profile[field] as string[];

    const next = list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];

    saveProfile({
      ...profile,
      [field]: next,
    });
  }

  // Frontend and backend now use the same mobility mode names.
  function convertMode(mode: string): MobilityMode {
    switch (mode) {
      case "walking":
        return "walking";

      case "driving":
        return "driving";

      case "wheelchair":
        return "wheelchair";

      case "scooter":
        return "scooter";

      case "bike":
        return "bike";

      case "transit":
        return "transit";

      default:
        return "walking";
    }
  }

  // Save mobility preferences to Supabase.
  async function handleSaveToSupabase() {
    try {
      if (profile.modes.length === 0) {
        alert("Please select at least one way you get around.");
        return;
      }

      const availableModes = profile.modes.map(convertMode);

      await saveMobilityProfile({
        availableModes,

        activeMode: convertMode(profile.activeMode),

        stepFree:
          profile.prefs.includes("step_free"),

        pavedSurface:
          profile.prefs.includes("paved_surface"),

        accessibleEntrances:
          profile.prefs.includes("accessible_entrances"),

        willingExtraDistance:
          profile.prefs.includes("willing_extra_distance"),

        preferShade:
          profile.prefs.includes("prefer_shade"),

        preferCovered:
          profile.prefs.includes("prefer_covered"),

        avoidCrowds:
          profile.prefs.includes("avoid_crowds"),

        wellLit:
          profile.prefs.includes("well_lit"),
      });

      alert("Mobility preferences saved!");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Something went wrong while saving your profile."
        );
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="How you get around"
      />

      <div className="space-y-6 p-4">
        {/* NAME */}
        <section>
          <label
            className="mb-2 block text-sm font-bold"
            htmlFor="name"
          >
            Your name
          </label>

          <input
            id="name"
            value={profile.name}
            onChange={(e) =>
              saveProfile({
                ...profile,
                name: e.target.value,
              })
            }
            className="w-full rounded-xl border border-gray-300 bg-white p-3"
          />
        </section>

        {/* MOBILITY MODES */}
        <section>
          <h2 className="text-sm font-bold">
            How do you get around?
          </h2>

          <p className="mb-2 text-xs text-gray-500">
            Pick all that apply.
          </p>

          <ChipGroup
            options={modeOptions}
            selected={profile.modes}
            onToggle={(value) =>
              toggle("modes", value)
            }
          />
        </section>

        {/* ACCESSIBILITY PREFERENCES */}
        <section>
          <h2 className="text-sm font-bold">
            Accessibility & comfort
          </h2>

          <p className="mb-2 text-xs text-gray-500">
            We&apos;ll plan routes around these.
          </p>

          <ChipGroup
            options={prefOptions}
            selected={profile.prefs}
            onToggle={(value) =>
              toggle("prefs", value)
            }
          />
        </section>

        {/* PARKING */}
        <section>
          <h2 className="text-sm font-bold">
            Parking buffer
          </h2>

          <p className="mb-2 text-xs text-gray-500">
            Arrive this early before your first class so
            parking isn&apos;t stressful.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={90}
              value={profile.parkingBufferMinutes}
              onChange={(e) =>
                saveProfile({
                  ...profile,
                  parkingBufferMinutes: Number(
                    e.target.value
                  ),
                })
              }
              className="w-24 rounded-xl border border-gray-300 bg-white p-3"
            />

            <span className="text-sm text-gray-600">
              minutes
            </span>
          </div>
        </section>

        {/* SAVE TO SUPABASE */}
        <button
          onClick={handleSaveToSupabase}
          className="w-full rounded-xl bg-usf-green py-3 font-semibold text-white active:bg-usf-green-dark"
        >
          Save mobility preferences
        </button>

        <p className="text-xs text-gray-400">
          Your preferences are saved on this device and to
          your MoWay profile.
        </p>
      </div>
    </>
  );
}