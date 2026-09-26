// Round profile circle. For now it shows the first letter of the name;
// a real photo can be added here later.
export default function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "size-20 text-3xl" : "size-11 text-lg";
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-full border border-usf-green bg-white font-bold text-leaf`}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
}
