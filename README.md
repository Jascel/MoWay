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
