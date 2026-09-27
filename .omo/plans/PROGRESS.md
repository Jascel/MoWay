# Demo routing execution ledger

## Resume checkpoint: 2026-09-27

- User resumed the original three-PR objective; prior STOP below is historical and revoked.
- Reconciled local branch/HEAD/diff and live GitHub: `andres/demo-routing-map-today` at `251367a103dac830ccf4ef91599b9fa4aef2d1f0`; PR #20 OPEN against main; PR 2/3 absent; existing five Map/schedule files intact, nothing staged.
- Step 5 diff inspected by root; integration/browser acceptance pending. Step 6 assigned to `/root/today_integration`, requested `gpt-5.6-luna`, high, fork none. Spawn accepted; agent list exposes status but no actual model or usage metadata.
- Ownership: worker app/page.tsx, lib/alerts.ts, components/DayAlert.tsx and focused tests only; root PROGRESS and all Git/PR operations. No Lane C work.
- Node 22.23.3 reverified. GitHub read succeeds with permitted network escalation. Browser inventory initially failed request-header policy; retry/fallback pending.
- Next: finish step 5 browser acceptance while worker implements step 6; inspect worker diff, four boundary checks and required review, then PR 2. Preserve saved user data.
- Step 5 browser observation (root, Chrome localhost:3000/map): saved scooter profile and saved schedule default Collins → CIS, real Google route 2 min / 0.3 mi. Changing origin through picker to Beard yields 3 min / 0.4 mi; green chosen route and gray dashed alternative visibly rendered. Garage/building groups and live report/category legend render. No profile/schedule/report mutation performed. Same-ID confirmation remains unverified in browser.
- Dev server root session 84109, Node22, localhost:3000; stop before build. Initial sandbox bind denied, permitted escalation succeeded. CUA inventory request-header failure recovered on Chrome tab creation.
- Current goal telemetry unavailable (`get_goal`: null); no current per-model tokens, cached-token counts, or cost counters exposed. Historical token count below is not current usage.
- `/root/map_default_check` (requested Luna high, fork none; actual metadata unavailable) owns campus-map.tsx, useDaySchedule.ts, google-map-canvas.tsx plus focused map test if needed. Investigating observed Collins Map vs Beard old Today recommendation; no speculative fix authorized. Also fixing confirmed-pin host rectangular outline observed in browser. Today worker owns separate files.
- Browser phone viewport check: Map route controls, live legend, mode panel render; console error query empty, glyph deprecation warnings remain. This is single-browser evidence, not multi-device realtime acceptance.
- map_default_check completed: runtime current saved schedule includes later CIS event → Collins/22 riding minutes; six-stop snapshot → Beard/19. No Map default logic change warranted. Only removed confirmed pin host `style.borderWidth`; DOM QA verified no rectangle, category color/borderColor/scale/check retained. Worker tsc/tests passed (43 at its snapshot); root final checks pending.
- today_integration first pass completed (47 tests, focused ESLint, tsc reported passing), root diff inspected. Follow-up assigned same worker: stale persisted alert reconciliation after navigation, no false cleared for route changes, commute explanation independent of banner dismissal, matching route endpoints, meaningful transition tests. Step6 not yet accepted.
- Root fresh Today reload now matches saved schedule: Collins/22 riding minutes, Google first leg2min, leave-by09:01 (09:30 class minus24min buffer minus3min drive minus2min first leg). Legacy +3 banner absent; console errors empty. Earlier stale Today snapshot is not current implementation evidence. Browser viewport restored after phone check.
- PR handoff must run mandatory project review-work five leaf lanes plus debugging audit; request Luna high explicitly. One focused reviewer preference yields to this mandatory project gate. Root full four-command boundary and final browser QA pending.
- Today follow-up2 reported52 tests + focused ESLint/tsc/diff-check pass; root found `unaffected:` identity parsing bug after dismissal and missing real endpoint eligibility guard. Same worker fixing these + reviewing aggregate report attribution. No commit/staging/PR2 yet; next exact action accept final fixes then stop dev, run all four checks, restart QA, commit and immutable-worktree review.
- Resumed after user interruption: same branch/files preserved. Today final follow-up accepted: identity parser handles unaffected, valid endpoint guard, report attribution; root npm test54/54, lint, tsc all exit0. Root build session19001 confirmed exit0 with15 pages. Logs `/private/tmp/moway-pr2-check-{0,1,2}.log`, `/private/tmp/moway-pr2-build.log`.
- Root caught removal of original Google route warnings in RoutePanel; assigned restoration to map_default_check (RoutePanel only). After that small preservation fix, rerun four checks before commit. Dev server84109 stopped cleanly; no active root server. Next: accept warning restore → boundary checks → production browser QA → commit PR2 → immutable worktree review → push/open stacked PR2. PR3 untouched.
- Warning restoration accepted. Final PR2 boundary all exit0: npm test54/54, npm run lint, npx tsc --noEmit, npm run build15 pages. Logs `/private/tmp/moway-pr2-final-{0,1,2}.log`, `/private/tmp/moway-pr2-final-build.log`.
- Production browser root QA: Today real Google2min first leg, Collins22min total, commute09:01; no fixed+3. Dismissed unaffected banner and reloaded: zero status banners, commute unchanged, no false cleared. Map same Collins→CIS2min, live confirmed pin and category legend. Browser errors empty. User schedule/profile/report records untouched; only alert dismissed. Realtime same-ID confirmation and three-context rehearsal remain manual, not passed.
- Production server root session88994 at localhost:3000 (log `/private/tmp/moway-pr2-server.log`). Implementation complete; next root staged review/commit and mandatory immutable-worktree review before PR2 push. Worker actual model metadata unavailable; both accepted requested gpt-5.6-luna/high/fork none. No token/cache/cost counters available.

## Historical checkpoint: paused by user, 2026-09-27

- User explicitly requested checkpoint and STOP; do not resume implementation in this session.
- Repository: /Users/andressabillon/Documents/Codex/MoWay.
- Current branch: `andres/demo-routing-map-today`, stack position 2/3.
- HEAD: `251367a103dac830ccf4ef91599b9fa4aef2d1f0` — Add demo routing core and alternative-route selection.
- Starting HEAD/main at PR #18: `8786e1436c73f3b8a39f7732122288ec53e10eec`.
- PR 1 committed, pushed and open: https://github.com/Jascel/MoWay/pull/20 (head `andres/demo-routing`, base `main`). Push exited 0; local upstream matches HEAD.
- PR 2 branch exists locally from PR 1 HEAD; no PR 2 commit, push or PR. PR 3 branch/PR not created.
- No checkpoint commit: PR 2 is incomplete and its full boundary validation/browser QA has not run. All changes preserved, nothing staged; no secrets committed.
- All eight child workers are completed/inactive. Root-owned dev session 16148 stopped cleanly with Ctrl-C (exit 0). No worker left mid-edit.

## Completed and current files

- Lane A steps 1 → 2 → 0 → 3 → 4 completed in PR 1: status mapping; all Google alternatives; verified geometry/shared constant; point-to-path distance; pure route choice; 43 focused executable tests.
- PR 1 files: data/mock.ts, lib/database/mapReport.ts, app/report/page.tsx (required unconfirmed status only), lib/maps/types.ts, lib/maps/walking-route.ts, components/maps/use-walking-route.ts, lib/maps/geo.ts, lib/maps/route-hazards.ts, lib/maps/demo-spot.ts, package.json, tests/register.mjs, tests/map-report.test.ts, tests/geo.test.ts, tests/route-hazards.test.ts, scripts/verify-demo-geometry.mjs, this ledger.
- Lane A step 5 + confirmed pins: worker implementation complete but NOT yet integration/browser accepted. Uncommitted modified files:
  - components/maps/campus-map.tsx: saved profile/schedule, winner garage/first-class defaults, automatic request and chooseRoute.
  - components/maps/google-map-canvas.tsx: garages, green chosen/gray dashed rejected routes, same-ID confirmed pin updates preserving category color.
  - components/maps/route-controls.tsx: grouped garage/building pickers.
  - components/RoutePanel.tsx: mode minutes, status, chips, hazards.
  - lib/useDaySchedule.ts: NEW UNTRACKED shared schedule hook; preserve and include in eventual PR 2 commit.
  - .omo/plans/PROGRESS.md: this tracked checkpoint.
- No deleted/half-written files remain. Today has NOT been edited for step 6. docs/demo-routing.md has NOT been created.

## Exact next action and remaining sequence

1. New Astra root reads this checkpoint and reconciles Git, then inspects the existing step-5 diff and available browser surface before accepting it. Do not redo completed core or geometry. Any fixes must go to a bounded Luna worker, not Astra.
2. First incomplete implementation step is Lane A step 6. Delegate Today integration (app/page.tsx, lib/alerts.ts, components/DayAlert.tsx and focused tests) to Luna high, or Sol low only if broader integration warrants it. Consume lib/useDaySchedule.ts in Today so Map and Today agree; preserve existing saved schedules.
3. Today requests winner garage → first class candidates, uses all active reports and campusMode, calls chooseRoute, feeds real first-leg minutes/chips and subtracts that leg exactly once in leave-by. Replace routeImpact/fixed +3 with alertFromChoice; confirmation same ID must reshow via status-sensitive keys; mode flip recomputes; disappearance only after successful refresh yields cleared. Test calculations and transitions.
4. PR 2 boundary: npm test, npm run lint, npx tsc --noEmit, npm run build must all exit 0; available browser QA and applicable review. Root alone commits/pushes `andres/demo-routing-map-today`; PR base `andres/demo-routing`, title “Wire route decisions into Map and Today”, explicit dependency on PR 1.
5. Create `andres/demo-routing-report` from completed PR 2 head. Lane B: all campus-near reports newest-first in app/report/page.tsx; mode-specific confirmation in components/StillThereCard.tsx; remove both saveAlert writers; components/maps/LocationPicker.tsx uses shared DEMO_SPOT.
6. Worker writes only docs/demo-routing.md: exact rule table/statuses, real vs hardcoded, geometry, exact phone A/B/C taps and current resets, honest acceptance classifications. Do not modify other documentation except this ledger.
7. PR 3 full four-command boundary + available QA/review, root commit/push; base `andres/demo-routing-map-today`, title “Complete report flow and demo rehearsal guide”, explicit PR 2 dependency. Do not merge/retarget.
- Source priority: user prompt → demo-readiness-2026-09-27.md → demo-routing-plan.md background. Relevant installed Next 16 guides must be read before new React/Next edits.
- No calendar/weather/notifications/garage fullness/unrelated polish. Lane C rows 2 and 3 deliberately gated on user's real green rehearsal and excluded; do not wait for gate or claim it passed. active_reports status already verified; never recheck/modify view.

## Retained API and exact rules

- computeWalkingRoute(apiKey, origin: CampusPlace, destination: CampusPlace): Promise<readonly WalkingRouteResult[]>; CampusPlace = building | garage.
- Hook success exposes candidates plus legacy first route; stale request version checks retained.
- distanceToPathMeters(point, path): number; clamped tangent-plane segments; empty Infinity; singleton haversine.
- chooseRoute(candidates, reports, myMode) → { chosen, rejected, extraMinutes, chips, hazards, status }. Never remove/rename fields.
- Status union: unavailable | clear | watching | rerouted | unaffected | blocked. Cleared is history-dependent alert state, not route-choice status.
- chosen may be null; rejected contains other candidates in stable policy order; extraMinutes is physical displayed chosen minus baseline fastest; hazards deduplicate by ID across chosen/fastest.
- Rank by confirmed blocker count, then exact mode minutes +2 per inconvenience, then original index. blocks_walking/scooter affect only named mode; bike blocked by blocks_all.
- Planned alert boundary: alertFromChoice(choice, report, mode): RouteAlert | null. Seen/dismiss keys include id:status and mode/result identity.

Exact readiness rules:
- Start from the fastest candidate for my mode.
- A **confirmed** report that **blocks my mode** within 25 m of a route removes that route. If all are removed, keep the least bad and warn.
- An **unconfirmed** report that blocks my mode does not reroute. Chip: "Watching a report."
- "Just annoying" adds a 2-minute nudge only.
- `blocks_all` blocks everyone. `blocks_wheelchair` blocks only wheelchair. `inconvenience` blocks nobody.

## Google Routes findings (real, not fabricated)

- mockDay wheelchair Smart Park: Beard Garage wins with 56 rolling minutes; Collins 58, Crescent Hill 72.
- Coordinates from data/campus-locations.json: Beard (28.058279, -82.416952) → CIS (28.058472, -82.411136).
- First REST attempt WALKING returned 400 INVALID_ARGUMENT; corrected REST enum WALK (JS SDK retains WALKING). Success: 3 routes, 685 / 685 / 720 m. No other buildings or coordinate nudges needed.
- Request used computeAlternativeRoutes:true, localhost Referer, X-Goog-Api-Key from .env.local, minimal mask routes.distanceMeters,routes.polyline.geoJsonLinestring.
- Shared lib/maps/demo-spot.ts DEMO_SPOT: (28.0574312, -82.413038), “Sidewalk between Beard Garage and CIS”.
- Production helper distances: 0 m / 0.00006069484871596117 m / 35.677204982036784 m. Both tied fastest routes hit the 25m corridor; third route does not. Wheelchair 10→11 minutes, real +1.
- Reproduce under Node 22: node --env-file=.env.local --import ./tests/register.mjs scripts/verify-demo-geometry.mjs (network escalation needed; never print key).
- Browser's existing saved scooter profile/additional CIS class produces a different winner (Collins). Do not clear or change user data to force mockDay geometry.

## Validation and evidence

- PR 1 root boundary: npm test 43/43, npm run lint, npx tsc --noEmit, npm run build all exit 0 under Node 22.23.3; build generated 15 pages; git diff --check exit 0.
- Current uncommitted checkpoint: root reran npx tsc --noEmit and npm test, both exit 0 (43/43); git diff --check exit 0. Test output: /private/tmp/moway-checkpoint-tests.log.
- map_wiring worker reports focused ESLint on its five files and whole npx tsc --noEmit passed. Full lint/build and new UI browser QA not yet run on PR 2; do not reuse PR 1 checks as PR 2 evidence.
- PR 1 review coverage binds exactly to 251367a103dac830ccf4ef91599b9fa4aef2d1f0:
  - Goal PASS: /root/pr1_goal final report (independent four checks).
  - Code PASS: /root/pr1_code final report.
  - Context PASS: /root/pr1_context final report.
  - Security PASS: /root/pr1_security final report.
  - QA PASS + debugging runtime audit PASS: /root/pr1_qa final report, 43 tests + live Google replay: confirmed wheelchair 720m/+1; unconfirmed 685m/watching; walking 685m/unaffected; no report 685m/clear.
- Review worktree /private/tmp/moway-review-pr1 remains detached at that SHA with node_modules symlink. No new review started for checkpoint.
- All prior workers completed: alternatives (three-file alternative route work), map_wiring (five-file step5 handoff), pr1_goal/code/context/security/qa (read-only PASS), workspace_access (read-only access check). No child committed or changed branches.

## Browser / manual QA

- Automated and passed on PR 1 surface: localhost:3000/map loads real Google map, live report pin, MSC→CWY route 9 min / 0.4 mi; screenshot observed. Root did not submit reports or reset profile/schedule.
- Observed Maps marker deprecation warnings. Root-layout font-class hydration mismatch occurred during concurrent dev/build; reload produced no new browser error. Do not claim source proven pre-existing; avoid concurrent dev/build and recheck.
- Manual verification required: all integrated eight-beat rehearsal twice with three independent contexts; same-ID confirmation route/pin/banner, real Today first-leg/leave-by, scooter message/report order, both mode flips, clear threshold and reset.
- No three-browser or ~1-second realtime claim. Step-5 styles remain browser-unverified.
- Current resets observed: Profile “Reset demo on this device” clears local moway.* only, not Supabase/auth. “Clear my reports” only reporter-owned rows; B is reset device. Never clear user data without scope/authorization.

## Environment and tooling

- Default shell Node 25.2.1 is unsuitable. Verified Node 22.23.3 available; prefix commands with PATH=/Users/andressabillon/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH. Reverify availability at restart.
- .env.local and nonempty NEXT_PUBLIC_GOOGLE_MAPS_API_KEY checked without exposing values. Never stage .env.local.
- Sandbox gh auth/network initially failed; escalated gh auth status and gh api user --jq .login succeeded as Jascel. No unresolved GitHub auth blocker; remote operations need permitted network access.
- TypeScript LSP installed globally via npm install -g typescript-language-server typescript (exit 0), TypeScript install decision allowed; built-in configuration works, no project dependency/config change. Biome declined.
- Requested four diagnostics passed: tests/register.mjs, data/mock.ts, lib/database/mapReport.ts, app/report/page.tsx (“No diagnostics found”); route-hazards.ts also clean.
- Warning still relevant: tests/route-hazards.test.ts LSP requests timed out waiting 3000ms for fresh diagnostics despite whole tsc passing. Do not equate timeout to a source error or claim all LSP diagnostics passed.
- Tool hook can report an error after an apply_patch write succeeded: inspect actual file before retrying.
- .omo is ignored by .git/info/exclude but PROGRESS is tracked from PR 1. Preserve local readiness/background plans.
- No genuine external implementation blocker at checkpoint. Stop is user's requested policy handoff; remaining acceptance is not yet complete.

## New execution policy (binding next session)

- ASTRA MEDIUM ROOT: planning/decomposition, worker coordination, review reports/integration diffs, validation, PROGRESS maintenance, sole Git/commit/push/PR ownership.
- Astra must NOT implement/refactor application code, tests, or documentation. PROGRESS maintenance is the explicit root responsibility.
- LUNA HIGH: all bounded implementation and file editing, focused fixes/tests, one focused reviewer per PR unless mandatory instructions require additional reviews.
- Explicit implementation settings: model: gpt-5.6-luna; reasoning_effort: high; fork_turns: none.
- SOL LOW only for broader cross-component integration when Luna is insufficient: model: gpt-5.6-sol; reasoning_effort: low; fork_turns: none.
- Use supported settings only. Verify actual model via available metadata; never silently substitute Astra for implementation. Workers get disjoint file ownership and must never commit/push/create PRs/change branches.
- Minimize tool output/context; no full-history forks or needless skill rereads.
- Existing map worker and PR1 review workers requested Luna high / fork none. Earlier alternatives worker used a full-history fork before user's minimization correction. Tool agent status exposes no actual model/token breakdown, so actual worker models are not verified.
- Latest observed goal tracker snapshot before this checkpoint: tokensUsed 804803; no per-model breakdown or cost available. This is reported telemetry, not an inference.
- Safe restart: all workers inactive, edits complete on disk, current tests/tsc green; resume from this ledger, not from stale earlier “pending” messages.
