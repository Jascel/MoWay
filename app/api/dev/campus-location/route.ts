import {
  CampusLocationValidationError,
  parseCampusLocationInput,
  saveCampusLocation,
} from "@/lib/maps/campus-locations-store";

/**
 * Development-only endpoint behind /dev/campus-locations. Writes one building
 * or garage into data/campus-locations.json. Disabled in production builds.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  try {
    const input = parseCampusLocationInput(body);
    const { replaced } = await saveCampusLocation(input);
    return Response.json({ ok: true, replaced, id: input.id });
  } catch (error) {
    if (error instanceof CampusLocationValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Could not save the location.";
    return Response.json({ error: message }, { status: 500 });
  }
}
