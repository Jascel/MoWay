// A greeting and a small friendly line that change with the time of day.
export function greetingFor(hour: number): { hello: string; line: string } {
  if (hour < 5) return { hello: "Hi", line: "Up late? Hope tomorrow's walk is easy." };
  if (hour < 12) return { hello: "Good morning", line: "Nice day for a walk." };
  if (hour < 17) return { hello: "Good afternoon", line: "Here's how the rest of your day looks." };
  if (hour < 21) return { hello: "Good evening", line: "Almost home. You've got this." };
  return { hello: "Hi", line: "Let's get tomorrow sorted." };
}
