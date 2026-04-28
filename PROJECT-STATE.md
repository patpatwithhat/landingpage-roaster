# Project State

_Last updated: 2026-04-29_

## Current status
- Login/Auth still works from the previous GitHub OAuth fix.
- Landingpage reviews now move toward a **global page + per-run history** model instead of isolated saved snapshots.
- URL identity is now normalized before storage (tracking params stripped, default ports removed, trailing slash cleanup, stable query sorting).
- The reports overview is now page-centric: one page card can represent multiple runs, with quick trend hints to the previous run.
- New analyses are now auto-saved as runs, so repeated reviews of the same page build a timeline instead of needing a manual save first.

## Last completed work
### 2026-04-29 — global page history foundation
Goal: make the core flow behave like this:
1. log in
2. see previously reviewed pages
3. review a new page
4. if the page already exists, add a new run record
5. compare newer runs against older ones

### What changed
- URL normalization hardened in `src/lib/analysis/page.ts`
- Saved-report storage was reworked in `src/lib/analysis/saved-reports.ts` to support:
  - global page records
  - per-run review records
  - compare hints to previous runs on the same page
  - owner-scoped listing on top of a shared global page identity
- `/reports` now shows reviewed pages with run counts and simple trend deltas
- `/reports/[id]` timeline now works from page runs instead of just same-owner saved snapshots
- New analysis runs are auto-saved from the analyzer flow in `src/app/page.tsx`

## Repo trail
### Most recent commits
- `5978ada` — `fix: exchange github oauth code on server`
- `8c8d61c` — `fix: refresh session state after github login`
- `dc75435` — `fix: hide github login when publishable key is unavailable`
- `d340a8e` — `feat: connect github auth flow to guest ownership`
- `47c6511` — `feat: scope reports and projects by session ownership`

### Files touched in the latest fix
- `src/app/auth/callback/page.tsx`
- `src/app/auth/callback/callback-client.tsx`

## Recommended next steps
### Immediate
- smoke-test the new page/run flow on:
  - preview
  - production
- verify these exact behaviors:
  - first review of a page creates the first run
  - second review of the same normalized URL creates a second run on the same page
  - compare links open the right previous/current pair
  - guest-to-user claim still preserves the expected visible history

### Product/workflow next
- decide whether page history should show only your own runs by default, or mix in global runs more aggressively in the main UI
- decide whether `/projects` should pivot from run IDs to page IDs for stronger project-level page history
- improve analyzer/report quality once the page/run foundation is stable

## Working rule going forward
After each meaningful change, update this file in 3 places only:
1. `Current status`
2. `Last completed work`
3. `Recommended next steps`

That keeps the repo understandable without building a giant process machine.
