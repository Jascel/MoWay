import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configuredApiKey: string | null = null;

export class GoogleMapsConfigurationError extends Error {
  readonly name = "GoogleMapsConfigurationError";

  constructor() {
    super("Google Maps was initialized with conflicting configuration.");
  }
}

function configureGoogleMaps(apiKey: string): void {
  if (configuredApiKey === apiKey) {
    return;
  }

  if (configuredApiKey !== null) {
    throw new GoogleMapsConfigurationError();
  }

  setOptions({ key: apiKey, v: "weekly" });
  configuredApiKey = apiKey;
}

export async function loadMapLibraries(apiKey: string): Promise<{
  readonly core: google.maps.CoreLibrary;
  readonly maps: google.maps.MapsLibrary;
  readonly marker: google.maps.MarkerLibrary;
}> {
  configureGoogleMaps(apiKey);
  const [core, maps, marker] = await Promise.all([
    importLibrary("core"),
    importLibrary("maps"),
    importLibrary("marker"),
  ]);
  return { core, maps, marker };
}

export async function loadGeocodingLibrary(
  apiKey: string,
): Promise<google.maps.GeocodingLibrary> {
  configureGoogleMaps(apiKey);
  return importLibrary("geocoding");
}

export async function loadRoutesLibrary(
  apiKey: string,
): Promise<google.maps.RoutesLibrary> {
  configureGoogleMaps(apiKey);
  return importLibrary("routes");
}
