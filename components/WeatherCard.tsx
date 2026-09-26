import { Cloud, CloudLightning, CloudRain, Sun } from "lucide-react";
import type { Weather } from "@/data/mock";
import { formatTime, weekdayShort } from "@/lib/time";

const icons = { sunny: Sun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning };

// Compact yellow weather card with squared corners, shown inside the Today header:
// "Thu, 91°F, storms at 2:30 PM". It receives ONE weather object as a prop (no state needed).
export default function WeatherCard({ weather, date }: { weather: Weather; date: string }) {
  const Icon = icons[weather.condition];
  return (
    <section className="flex w-fit max-w-full items-center gap-2.5 rounded-lg bg-sun px-3 py-2.5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-white/70">
        <Icon className="size-6 text-leaf" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-bold uppercase leading-tight tracking-wider">
          {weekdayShort(date)}, {weather.tempF}°F
          {weather.stormAt && `, storms at ${formatTime(weather.stormAt)}`}
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink/70">{weather.summary}</p>
      </div>
    </section>
  );
}
