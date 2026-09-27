# Demo routing execution ledger

## Current state

- Branch: `andres/demo-routing`; stack position 1 of 3.
- Starting HEAD and merge-base with origin/main: `8786e1436c73f3b8a39f7732122288ec53e10eec` (PR #18). Initial worktree clean.
- Root is Astra; planning locally as requested. Root alone owns Git operations.
- Node shell default is 25.2.1; all checks use Node 22.23.3 with `PATH=/Users/andressabillon/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH`.
- `.env.local` and nonempty Maps key verified without printing the key; never stage this file.
- Sandboxed gh failed; network-enabled `gh auth status` and `gh api user --jq .login` passed as Jascel. Network operations require escalation.
- Execution tool initially failed its handshake, then recovered. No edits occurred during the failure.
- Read AGENTS.md, readiness plan, background routing plan, relevant consumers, programming and Git skills. Existing visual system will be preserved; no unrelated tooling/design files or dependencies.

## Execution plan (dependencies and acceptance)

1. **In progress: Lane A step 1.** `data/mock.ts`: required Report.status union `unconfirmed | confirmed`, mock status, and the Report construction in `app/report/page.tsx`. `lib/database/mapReport.ts`: preserve row status. Add Node built-in focused runner (`tests/register.mjs`, `tests/*.test.ts`, `package.json` npm test), using installed TypeScript for alias-aware transpilation. Tests prove both status values survive mapping.
2. **Pending: Lane A step 2, depends on 1.** `lib/maps/types.ts`: shared CampusPlace (building or garage). `lib/maps/walking-route.ts`: `computeWalkingRoute(apiKey, origin, destination): Promise<readonly WalkingRouteResult[]>`, alternatives true, validate each returned route. `components/maps/use-walking-route.ts`: success includes `candidates`; retain first `route` only until PR 2 consumers migrate. Read installed Next client-component guidance before edits. Observable: all Google alternatives reach callers; existing PR 1 UI still works.
3. **Pending: Lane A step 0, depends on 2.** Execute actual `planSmartPark` over mockDay building coordinates from `data/campus-locations.json`. Call Routes REST with alternatives, localhost Referer, key header, minimal fields. Winner to CIS first, then other existing buildings / justified coordinate adjustment if needed. Measure separation, record attempts/counts/distances, then create `lib/maps/demo-spot.ts` only from verified geometry. No invented route data.
4. **Pending: Lane A step 3, after geometry attempt.** `lib/maps/geo.ts`: `distanceToPathMeters(point: MapPosition, path: readonly MapPosition[]): number`. Local tangent-plane segment projection, clamped endpoints; empty path Infinity, singleton haversine. Tests: segment interior, endpoints, duplicates, empty/single point, and 25m threshold.
5. **Pending: Lane A step 4, depends on 1/2/3.** New `lib/maps/route-hazards.ts`: `isBlockingForMe(report: Report, mode: Mode): boolean`; `hazardsOnRoute(route: WalkingRouteResult, reports: readonly Report[]): readonly Report[]`; `chooseRoute(candidates: readonly WalkingRouteResult[], reports: readonly Report[], myMode: Mode): RouteChoice`. Result retains `chosen` (route or null), `rejected` (all others ordered by policy), `extraMinutes` (chosen displayed minutes minus fastest displayed minutes), `chips` (strings), `hazards` (deduplicated relevant fastest/chosen reports), `status`.
   - Exact status union: `unavailable | clear | watching | rerouted | unaffected | blocked`. Map panel and Today alert consume it. `unavailable`: no candidates; `clear`: no relevant hazards; `watching`: unconfirmed blocking hazard without a reroute; `rerouted`: alternate selected; `unaffected`: relevant report does not block mode; `blocked`: every route has a confirmed blocker. Cleared is history-dependent and belongs to alerts, not chooseRoute.
   - Stable ranking: confirmed-blocker count (zero first), then mode exact minutes plus 2 per inconvenience, then original order. When all blocked, smallest blocker count wins, then same score. Baseline fastest ignores penalties. Nudge affects selection, not physical travel time. Support existing blocks_walking / blocks_scooter as their named mode only; bike is blocked by blocks_all.
   - Focused tests: full impact/mode matrix, confirmed reroute, unconfirmed warning, inconvenience nudge, all-blocked fallback, metadata/order, tie/empty inputs, immutability, 25m inclusion.
6. **Pending: PR 1 boundary.** Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` under Node 22. Review/audit, update this ledger, inspect/stage only scope, commit on non-main, append hash. Push `andres/demo-routing`; PR base main, title “Demo routing core and alternative-route selection”.
7. **Pending: Lane A step 5 and pins, on `andres/demo-routing-map-today` from completed PR 1.** `components/maps/campus-map.tsx`, `route-controls.tsx`, `google-map-canvas.tsx`, `components/RoutePanel.tsx`: garages in pickers, Smart Park winner / first scheduled class defaults, candidates fed into chooseRoute using saved profile and all reports; chosen green, rejected gray dashed; mode minutes, chips and status hazards. Confirmed pins keep category colors and gain check glyph/scale/border. Any extracted map effect remains in components/maps. Observable: confirmation redraws same report ID and profile flip recomputes without refetch.
8. **Pending: Lane A step 6, after 7.** `app/page.tsx`, `lib/alerts.ts`, `components/DayAlert.tsx` and narrowly scoped shared hooks/helpers as needed: same garage-first-class route choice, first-leg real minutes/chips, leave-by subtracts first leg exactly once. `alertFromChoice(choice, report, mode): RouteAlert | null`; alert status also admits cleared. All active reports; persistent seen/dismiss keys include `${id}:${status}` and mode/result identity so confirmation and profile changes redisplay. Disappearance yields cleared only after successful report refresh. Remove routeImpact use and fixed +3 path on Today. Tests for alerts/first leg/leave-by and transitions.
9. **Pending: PR 2 boundary.** All four checks, available browser evidence and review; commit/push `andres/demo-routing-map-today`; PR base `andres/demo-routing`, title “Wire route decisions into Map and Today”; explicitly dependent on PR 1.
10. **Pending: Lane B on `andres/demo-routing-report` from completed PR 2.** `app/report/page.tsx`: all campus-near reports newest-first. `components/StillThereCard.tsx`: mode-specific confirmation, scooter “Confirmed. Doesn't affect your ride.” Remove submit/confirm `saveAlert` calls. `components/maps/LocationPicker.tsx`: shared verified DEMO_SPOT. Focused ordering/message tests where pure.
11. **Pending: Documentation and available QA.** Run dev on localhost:3000 and available browser automation; inspect loading, errors, map/route/pin states, report messages/order, profile changes, Today math. `docs/demo-routing.md`: rules/status, real/mock list, geometry evidence, exact A/B/C taps, existing resets, per-item Automated and passed / Code-verified / Manual verification required / Blocked. Never claim three independent contexts unless exercised. Real three-browser rehearsal remains manual; no waiting for it.
12. **Pending: PR 3 boundary.** Four checks and review, update ledger before/after commit and PR; push `andres/demo-routing-report`; base `andres/demo-routing-map-today`, title “Complete report flow and demo rehearsal guide”, explicit PR 2 dependency. Verify three PR heads/bases/URLs. No merging/retargeting.

## Exact readiness route rules

- Start from the fastest candidate for my mode.
- A **confirmed** report that **blocks my mode** within 25 m of a route removes that route. If all are removed, keep the least bad and warn.
- An **unconfirmed** report that blocks my mode does not reroute. Chip: "Watching a report."
- "Just annoying" adds a 2-minute nudge only.
- `blocks_all` blocks everyone. `blocks_wheelchair` blocks only wheelchair. `inconvenience` blocks nobody.

## Evidence / pending gates

### Step 4 completed; PR 1 pre-commit checkpoint

- 43 focused tests passed (including six route-selection cases first observed failing); npm run lint, npx tsc --noEmit, npm run build all exited 0 under Node 22.23.3. Production build generated 15 pages.
- Root browser QA: localhost:3000/map rendered Google map, existing live pin, and real MSC→CWY route (9 min, 0.4 mi). This is the existing PR 1 surface; multi-route rendering belongs to PR 2. No three-browser claim.
- Browser logged existing Maps marker deprecation warnings and a root-layout font-class hydration mismatch during concurrent dev/build; reload/restart check pending. Avoid simultaneous dev/build in later boundaries.
- TypeScript LSP route-hazards.ts clean; route-hazards.test.ts fresh-diagnostic requests timed out twice despite tsc passing. Four user-requested files previously clean.
- New modules all below 100 code lines. Existing Report page is 389 lines; PR 1 only adds required status to its Report construction, preserving user's bounded scope; Lane B can extract touched responsibilities.
- Architecture: pure routing module, typed six-field result, no React/Google/Supabase imports; no any/suppression; stable immutable input ordering; boundary adapters unchanged except status/alternatives.
- Preparing atomic PR 1 implementation commit. Known previous hash remains 8786e1436c73f3b8a39f7732122288ec53e10eec. Review-work lanes/runtime audit will bind to the new commit before PR creation.

### Step 3 completed; step 4 in progress

- Five tests passed under Node 22 after expected missing-function failures for the three geometry tests. TypeScript LSP active and clean on implemented geometry.
- Production helper remeasurement against live Routes: **0m**, **0.00006069485m**, **35.677204982m** from DEMO_SPOT. Route lengths unchanged (685/685/720m). Geometry step fully verified.

### Steps 2 and 0 completed; step 3 in progress

- Step 2 integrated: all candidates retained, garages accepted; worker tsc, focused ESLint, diff whitespace checks passed. First route retained for PR 1's existing consumers only.
- Google Routes REST first returned HTTP 400 INVALID_ARGUMENT for WALKING; corrected REST enum to WALK (JS SDK uses WALKING). Retried successfully with alternatives true, localhost Referer, key header, and fields distanceMeters/polyline.geoJsonLinestring.
- Winner Beard origin `(28.058279, -82.416952)` to CIS `(28.058472, -82.411136)`: **3 routes**, lengths **685, 685, 720 m**. No coordinate adjustments or other destinations necessary.
- Shared DEMO_SPOT `(28.0574312, -82.413038)` is a vertex of fastest route 1, within 0.01m of tied route 2, and **35.6772049833m** from route 3 (independent segment-projection calculation over full third polyline). Thus both tied fastest paths are blocked within 25m while the 720m alternative remains clear. Wheelchair minutes round from 10 to 11, a real +1. Production helper will remeasure all routes after step 3.
- New script `scripts/verify-demo-geometry.mjs` reproduces real request, with no secret in output.
- User requested TypeScript LSP installation: installed `typescript-language-server` + `typescript` globally, recorded allowed decision. Builtin configuration resolves it; diagnostics roundtrips on tests/register.mjs, data/mock.ts, lib/database/mapReport.ts, app/report/page.tsx all returned “No diagnostics found”. No project configuration/dependency change required. Biome remains declined.

### Step 1 completed

- `npm test` under Node 22: both status tests failed first (undefined status), then both passed after mapping change.
- Required status added to mock report and submit construction. No backend view reads or changes.
- Step 2 in progress with bounded alternatives worker (only types, route client, route hook); root owns integration/Git. Smart Park execution confirmed Beard Garage wins (56 rolling minutes vs Collins 58, Crescent Hill 72); geometry request will follow step 2.
- LSP unavailable (prior declined TypeScript installation; Biome unavailable and no install-decision tool exposed). Explicit tsc/ESLint remain validation authorities.
- Frontend skill design/perfection references read; user scope prohibits unrelated design docs, extra tooling dependencies and polish, so existing component system is the visual contract.

- No implementation checks run yet; no commits or PRs created.
- Manual QA: all eight beats pending; three-browser realtime rehearsal explicitly remains manual.
- Lane C rows 2 and 3 intentionally gated and excluded. active_reports status is accepted as verified; no view recheck/modification.
- Next action: finish installed Next guide reads, implement step 1 with failing/passing focused tests.
