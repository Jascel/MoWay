# MoWay routing demo guide

This guide rehearses the three-person story: A is the wheelchair user whose
route should change, B reports the blocked sidewalk, and C confirms it while
using a scooter. Use a disposable QA origin when possible (for example a
separate local port and browser profile). Do not reset the existing user's
origin or delete existing Supabase rows to make the demo fit the mock day.

## What the route decision means

The route chooser receives Google walking-route candidates, active campus-near
reports, and the user's campus mode. It starts with the fastest candidate for
that mode. A report is on a route when its point is within 25 m of the route
polyline.

| Status | Meaning in the route choice | Visible implication |
| --- | --- | --- |
| `unavailable` | No usable candidate or baseline route exists. | No route choice is shown. |
| `clear` | No report is on the selected route or its fastest baseline. | Fastest route; no hazard message. |
| `watching` | An **unconfirmed** report that blocks this mode is near the route. | Keep the route; show “Watching a report.” |
| `rerouted` | A candidate other than the fastest ranks better for this mode. A confirmed blocker commonly causes this; an inconvenience report can also change ranking through its nudge. | Green selected route, rejected route(s) gray/dashed, and a `+N min` chip (the displayed value can be `+0 min` after rounding). |
| `unaffected` | A nearby report exists, but it does not block this mode and did not change the selected candidate. | Keep the fastest route; chips/message describe the report's effect (mode-mismatched blockers say it does not affect this route). |
| `blocked` | Every candidate has a confirmed blocker for this mode. | Keep the least-bad candidate and warn that all available routes have barriers. |

`cleared` is not a route-choice status. It is a history-dependent Today alert
state emitted after a previously observed report is absent from a successful
active-report refresh: “Cleared by the community. Your route is back to
normal.” A failed or pending refresh does not count as cleared.

Impact applies by campus mode as follows:

| Report impact | Modes it blocks |
| --- | --- |
| `blocks_all` | Every campus mode |
| `blocks_wheelchair` | Wheelchair only |
| `blocks_walking` | Walking only |
| `blocks_scooter` | Scooter only |
| `inconvenience` (“Just annoying”) | No mode is blocked; it contributes a two-minute scoring nudge |

Confirmed blockers are ranked before route time; then the chooser uses the
mode-specific minutes (including the inconvenience nudge), then the original
Google order. If all candidates are blocked, it retains the least-bad route so
the user still has a route and receives `blocked`. `extraMinutes` is the
displayed selected-route minutes minus the displayed fastest-route minutes.

## Verified demo geometry

The shared report pin is `DEMO_SPOT`:

```text
28.0574312, -82.413038
Sidewalk between Beard Garage and CIS
```

For the mock day, Smart Park's wheelchair winner is Beard Garage. The verified
Google walking request from Beard Garage to CIS returned three candidates at
685 m, 685 m, and 720 m. The demo point measured approximately 0 m from the
first tied fastest path, 0.0000606948487 m from the second tied fastest path,
and 35.677205 m from the third path. Thus it is inside the 25 m corridor for
the two tied fastest candidates and outside it for the 720 m alternative.

Using the mode speed table, the wheelchair estimate changes from 10 minutes
to 11 minutes on the 720 m route: a real displayed `+1 min` for this fixture.
The geometry is verified against the real Google route response; the report
itself and its confirmation still come from the Supabase report flow.

## Exact rehearsal taps

Do the profile setup on each disposable context before the report sequence.
The Profile screen saves changes immediately.

### A — wheelchair route recipient

1. Tap **Profile** → **How do you get around?** and make sure both **Walking**
   and **Wheelchair** are selected. In **Using today**, tap **Wheelchair**.
2. Tap **Map**. Let the route load with the Smart Park garage and first class,
   then confirm the selected route is green and any alternative is gray/dashed.
3. Tap **Today** and leave it open for the report transitions. A can also use
   **Map** to see the pin and route change; Today supplies the banner, first-leg
   time, and leave-by time.

### B — reporter/reset device

1. Tap **Profile** → **How do you get around?** and select **Walking**; under
   **Using today**, tap **Walking**. B is the walking reporter in the story;
   the report impact is independent of B's mode.
2. Tap **Report**.
3. Tap **Blocked sidewalk**.
4. Under **Who does it affect?**, tap **Blocks wheelchairs**.
5. Leave **Temporary (about a day)** selected, then tap **Use demo spot**.
6. Optionally enter a short note, then tap **Submit report**.
7. Leave the report active. Do not tap **Clear my reports** until the run is
   over; clearing it resolves only reports owned by B.

At this point A should receive an unconfirmed report after the active-report
refresh. A's route remains unchanged and the route status is `watching`.

### C — scooter confirmer

1. Tap **Profile** → **How do you get around?** and select **Scooter**; under
   **Using today**, tap **Scooter**.
2. Tap **Report** and find B's report in **Near you**. The list is ordered
   newest first; use the location text to distinguish it from older reports.
3. In that report's card, tap **Yes, still there**.
4. Confirm the response copy is truthful for C's mode: a wheelchair-only
   barrier shows **“Confirmed. Doesn't affect your ride.”** An inconvenience
   report shows **“Confirmed. Thanks for the update.”** A report that blocks the
   current mode says it can block that mode's route: for example, **“Confirmed.
   This can block your ride route.”** for C on a scooter and **“Confirmed. This
   can block your rolling route.”** for A in a wheelchair.

After C's confirmation, return to A. The same report ID changing from
unconfirmed to confirmed should update the pin/status, turn the old route gray
and the selected route green, show the real `+N min`/avoid chips, and update
Today’s first-leg minutes and leave-by time. A should see a rerouted alert.

### Mode flip on A

1. On A, tap **Profile** → **Using today** → **Walking**.
2. Tap **Today**, then **Map** if needed. Because the report blocks wheelchairs
   only, the route should return to the fastest walking route and the alert
   should explain that it does not affect the walking route.
3. Tap **Profile** → **Using today** → **Wheelchair** to restore the rerouted
   case and verify the same report can drive the choice again.

Optional clear check (a separate report is required because one account cannot
answer the same confirmation twice): have B submit another report, have C tap
**No, it’s clear** on that second card, and watch A after the next refresh. The
active-report view's confidence threshold and resulting disappearance still
need live rehearsal; record whether the pin disappears and whether A receives
the cleared-history alert.

## Reset and data-preservation rules

For a repeat, B taps **Report** → **Clear my reports** and waits for the
operation to finish. This resolves B's own active and confirmed rows only. It
does not clear reports created by A or C, and it does not reset browser profile
or schedule state.

If a disposable browser needs a local-only reset, tap **Profile** → **Reset
demo on this device** and confirm. This removes local `moway.*` values,
including profile/photo, added or edited schedule events, alert history, drive
estimate cache, and the welcome flag. It does not touch Supabase/auth or
database reports. Do not use this control on the user's existing origin merely
to force the mock day: saved schedules can differ from `mockDay`, and the
saved schedule may choose Collins rather than Beard.

## What is real and what is fixture data

Real or code-backed behavior:

- Google supplies walking alternatives and route paths; route eligibility uses
  the measured path geometry and the shared 25 m rule.
- Active reports, status changes, confirmation counts, and realtime refreshes
  come from Supabase when configured. Campus-near filtering and newest-first
  ordering are applied before the Report cards are shown.
- Report status is carried into the route chooser. Unconfirmed and confirmed
  reports therefore produce different choices without changing the report ID.
- Campus mode, profile, report history, alert identity, and local schedule edits
  persist in the browser according to their existing storage contracts.
- Walking/rolling minutes on a Google candidate are computed from its distance
  and the mode speed table. Smart Park's all-day garage ranking and every
  non-first-leg campus walk use local estimates.

Fixture or deliberately simplified behavior:

- The demo point and its label are a shared hardcoded, geometry-verified
  constant; they are a reliable rehearsal anchor, not a live geocoder result.
- Drive time geocodes the entered address and asks OSRM for a typical drive to
  the campus center (used as the Marshall Student Center). It has no traffic
  awareness; the fallback drive time is mock data.
- Campus legs after the Google garage-to-first-class leg use straight-line
  distance times the campus detour factor and mode speed table. They are
  estimates, not turn-by-turn routes.
- The default day/profile, weather, parking fullness percentage, and fallback
  parking values are mock data. User-saved schedules and profile selections can
  replace the defaults, so the displayed garage and numbers may differ from
  the geometry fixture.
- Calendar sync, notifications, live garage fullness, and traffic-aware drive
  routing are outside this rehearsal.

## Acceptance record

The following is the honest status at the time this guide was written:

| Check | Classification | Evidence/status |
| --- | --- | --- |
| Route policy, mode impact mapping, path corridor, and alert transition logic | Code/tests | Implemented in the routing and alert helpers; unit coverage exists for the PR2 routing surface. |
| Report flow changes | Code + production/disposable QA observed | On production localhost:3000, the demo button produced `Sidewalk between Beard Garage and CIS` at `28.0574312, -82.413038`. On disposable localhost:3001, “PR3 QA disposable report” appeared first over an older report; scooter Yes changed confirmations 0→1 and showed “Thanks! Confirmed. Doesn't affect your ride.” Report submission/confirmation no longer writes a Today alert. |
| Beard→CIS candidate geometry and `DEMO_SPOT` | Verified | 685/685/720 m candidates; 0 m, ~0.000061 m, and ~35.677 m path distances; wheelchair 10→11 min. |
| Report validation and map fallback | Disposable QA observed | Empty submit showed the required-fields error. The disposable origin's Maps key was rejected with `RefererNotAllowedMapError` (environment limitation); the graceful map-unavailable fallback still allowed the shared demo coordinates/label and a live Supabase submit. Do not generalize this into a broad no-errors claim. |
| Final automated boundary checks | Passed | `npm test` 54/54, lint, TypeScript check, and production build (15 pages) all passed. |
| Single-browser Today/Map production observation | Manually observed | Real Google route, saved schedule/profile behavior, route/pin UI, and no browser errors were observed in the prior PR2 pass. This is not realtime multi-context evidence. |
| Two complete rehearsals with three independent browser contexts | Checklist — not passed | Still unperformed. |
| Same-ID confirmation propagating pin/banner/route and ~1-second timing | Checklist — not passed | Still unperformed; do not claim realtime latency. |
| Wheelchair → walking → wheelchair live profile flip | Checklist — not passed | Logic is covered in code; cross-context/manual propagation is still unperformed. |
| Community clear causing disappearance and `cleared` history state | Checklist — not passed | Depends on the live confidence threshold and a separate report. |
| Owner-only cleanup of the disposable report | Manually observed | On disposable localhost:3001, **Clear my reports** removed the QA report from **Near you** and **Your reports** while an older existing report remained. Existing localhost:3000 reports/profile were untouched. |
| Full reset and repeat without touching existing user data | Checklist — not passed | Reset instructions are documented; a full repeat remains to be executed on disposable QA contexts. |

Record the date, origin/context, report IDs, visible timestamps, and screenshots
when the manual rows are run. Keep the existing user's saved schedules,
profile, reports, and local storage intact unless the test uses a disposable
origin.
