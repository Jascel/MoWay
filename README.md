This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

MoWay is a USF Tampa day planner that combines a student's schedule, mobility preferences, parking, weather, and community reports into one plan for moving across campus.

## Team setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The real `.env.local` file is ignored by Git. Add variable names and placeholders to `.env.example`, never API keys.

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

The bundled `CAMPUS_BUILDINGS` fixture uses approximate outdoor pedestrian approach points selected from mapped walkways. They are not survey-grade doors or verified accessible/public entrances. A future database integration can map its building records into `CampusBuilding[]` without adopting this fixture as a schema.

Use short-lived branches such as `andres/maps`, `connie/ui`, and `adriana/backend`. Keep commits focused, open pull requests into `main`, and pull the latest `main` before starting work.

## Scripts

- `npm run dev` starts the development server.
- `npm run lint` checks the code with ESLint.
- `npm run build` creates a production build.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
