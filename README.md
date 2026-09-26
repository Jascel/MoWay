This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

MoWay is a USF Tampa day planner that combines a student's schedule, mobility preferences, parking, weather, and community reports into one plan for moving across campus.

## Team setup

Use Node.js 22.x and npm. The repository records these expectations in
`package.json` and `.nvmrc`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The real `.env.local` file is ignored by Git. Add variable names and placeholders to `.env.example`, never API keys. Restart the development server after changing public environment variables because Next.js includes `NEXT_PUBLIC_` values in the browser bundle.

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps features | Browser-visible key; restrict it to the required APIs and allowed origins. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Optional Google cloud map styling | Leave empty to use the app's default map ID behavior. |
| `NEXT_PUBLIC_SUPABASE_URL` | Calling the dormant Supabase database helpers | Project URL from Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Calling the dormant Supabase database helpers | Browser-safe publishable key; this is not a service-role secret. |

Supabase is initialized lazily. Pages can run without Supabase credentials because the current Profile and Report experiences use `localStorage`; calling a database helper without both Supabase variables throws a configuration error. When configured, authentication and database errors are thrown to the caller rather than reported as successful saves.

## Integration status

| Area | Baseline status |
| --- | --- |
| Profile and Report UI persistence | Local-only via `localStorage`; no Supabase reads or writes are wired. |
| Supabase client | SDK dependency and lazy client factory are present; no live project connection is claimed. |
| Database helpers | Adriana's helper contracts are preserved but are not called by the UI. |
| `supabase/config.toml` | Local Supabase CLI configuration only; it is not a migration and does not establish a hosted schema. |
| Migrations and live schema | Unverified and deferred. No migration files are present in this baseline. |
| Row Level Security (RLS) | Unverified and deferred. |
| Authentication | Unverified, deferred, and not wired into the UI. |
| Realtime | Deferred and not wired. |
| Hosted project settings | Unverified and deferred. |

This baseline intentionally does not add auth, database writes from UI, schema changes, realtime subscriptions, or hosted Supabase settings.

## USF walking map

The `/map` page displays three USF Tampa destinations and requests a real Google walking route only after you press **Get walking route**. It shows the returned path, estimated minutes, and distance. These are ordinary Google walking directions, not an accessible-route guarantee.

Enable both **Maps JavaScript API** and **Routes API** in the same Google Cloud project, with billing active. Then add local values to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
```

`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is optional for local development; the app uses Google's `DEMO_MAP_ID` when it is absent. Use your own JavaScript map ID before a production release. Restart `npm run dev` after changing an environment file, then open [http://localhost:3000/map](http://localhost:3000/map).

`NEXT_PUBLIC_` values are intentionally included in the browser bundle. Protect the Maps key with website referrer restrictions and API restrictions for Maps JavaScript API and Routes API. If the map is dark, watermarked, or unavailable, check that billing is active, both APIs are enabled, and the allowed referrer includes the exact local or deployed origin. Keep the real key in `.env.local`; never commit it.

### Map integration

`CampusMap` is exported from `components/maps/campus-map.tsx` and accepts `apiKey`, `mapId`, and `buildings: readonly CampusBuilding[]`. The plain application types live in `lib/maps/types.ts`:

```ts
type CampusBuilding = {
  readonly id: string;
  readonly code: string; // schedule code, e.g. "CIS"
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly position: { readonly lat: number; readonly lng: number };
};

type CampusGarage = {
  readonly id: string;
  readonly name: string;
  readonly position: { readonly lat: number; readonly lng: number };
};

type WalkingRouteResult = {
  readonly originId: string;
  readonly destinationId: string;
  readonly durationMillis: number;
  readonly distanceMeters: number;
  readonly path: readonly { readonly lat: number; readonly lng: number }[];
  readonly warnings: readonly string[];
};
```

The bundled `CAMPUS_BUILDINGS` (`lib/maps/campus-buildings.ts`) and `CAMPUS_GARAGES` (`lib/maps/campus-parking.ts`) fixtures hold static coordinates that were resolved once with the Google Maps Geocoder (or OpenStreetMap where Google could not resolve the name) and committed; the app never geocodes at runtime. They are approximate outdoor points, not verified accessible entrances, and each entry notes its source so it can be hand-adjusted. `findBuildingByLabel("CIS")` resolves schedule labels by code, name, or alias. A future database integration can map its records into these types without adopting the fixtures as a schema.

Use short-lived branches such as `andres/maps`, `connie/ui`, and `adriana/backend`. Keep commits focused, open pull requests into `main`, and pull the latest `main` before starting work.

## Scripts

- `npm run dev` starts the development server.
- `npm run lint` checks the code with ESLint.
- `npm run build` creates a production build.
- `npx tsc --noEmit` type-checks the project.

## Getting Started

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The canonical campus map route is `/map`; `/route-preview` is temporary and is not the canonical map URL.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
