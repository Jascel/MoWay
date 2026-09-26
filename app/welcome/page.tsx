import Welcome from "@/components/Welcome";

// `?step=1` or `?step=2` jumps straight to a step (handy for testing).
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  return <Welcome initialStep={Math.min(2, Math.max(0, Number(step) || 0))} />;
}
