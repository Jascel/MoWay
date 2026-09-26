import type { Weather } from "@/data/mock";
import { formatTime, weekdayShort } from "@/lib/time";

const icons = { sunny: "☀️", cloudy: "☁️", rain: "🌦️", storm: "⛈️" };

// Green strip under the header: "Fri, 91°F, storms at 2:30 PM".
// It receives ONE weather object as a prop and only displays it (no state needed).
export default function WeatherCard({ weather, date }: { weather: Weather; date: string }) {
  return (
    <section className="flex items-center gap-3 bg-usf-green px-4 pb-5 text-white">
      <span className="text-4xl">{icons[weather.condition]}</span>
      <div>
        <p className="text-lg font-semibold">
          {weekdayShort(date)}, {weather.tempF}°F
          {weather.stormAt && `, storms at ${formatTime(weather.stormAt)}`}
        </p>
        <p className="text-sm text-white/80">{weather.summary}</p>
      </div>
    </section>
  );
}
