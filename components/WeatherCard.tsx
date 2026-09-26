import { Cloud, CloudLightning, CloudRain, Sun } from "lucide-react";
import type { Weather } from "@/data/mock";
import { formatTime, weekdayShort } from "@/lib/time";

const icons = { sunny: Sun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning };

// Compact yellow weather card with squared corners, shown inside the Today header:
// "Thu, 91°F, storms at 2:30 PM". It receives ONE weather object as a prop (no state needed).
export default function WeatherCard({ weather, date }: { weather: Weather; date: string }) {
  const Icon = icons[weather.condition];
  return (
    <section className="flex w-fit max-w-full items-center gap-3 rounded-lg bg-sun p-3">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white/70">
        <Icon className="size-7 text-leaf" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-lg font-semibold leading-tight">
          {weekdayShort(date)}, {weather.tempF}°F
          {weather.stormAt && `, storms at ${formatTime(weather.stormAt)}`}
        </p>
        <p className="text-xs text-ink/75">{weather.summary}</p>
      </div>
    </section>
  );
}
