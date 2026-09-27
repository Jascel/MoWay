// Round profile circle. Shows the person's photo if they added one,
// otherwise the first letter of their name.
export default function Avatar({
  name,
  photo,
  size = "md",
}: {
  name: string;
  photo?: string;
  size?: "md" | "lg";
}) {
  const dims = size === "lg" ? "size-20 text-3xl" : "size-11 text-lg";

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a small picture stored in the browser, no need to optimize
      <img
        src={photo}
        alt={`${name || "Your"} profile photo`}
        className={`${dims} shrink-0 rounded-full border-[3px] border-usf-green object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-full border-[3px] border-usf-green bg-white font-logo text-usf-green`}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
}
