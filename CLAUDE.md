# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Additional notes

- **No test suite.** `npm run lint` is just `tsc --noEmit`; `npm run build` also
  runs `tsr generate` first, so run the build (or the dev server) after adding
  or renaming a route file to refresh `src/routeTree.gen.ts`.
- The `make container*` targets listed in AGENTS.md have no Makefile in this
  repo yet.
- Node >= 22 (`.nvmrc`). The project `.npmrc` only sets the `@arompr` registry;
  the GitHub Packages token lives in the user-level `~/.npmrc`.
- Deployment is a Render Static Site (`render.yaml`): `VITE_API_URL` is baked in
  at build time, and the build writes a temporary `.npmrc` that reads
  `GITHUB_TOKEN`. SPA routing relies on the `/* -> /index.html` rewrite there.

## Availability editing flow

Editing the calendar touches several modules; the data path is:

1. `useEventAvailabilities` (`features/event/queries.ts`) fetches every
   participant's ranges as UTC instants and normalizes them to `...Z` ISO
   strings.
2. `AvailabilityCalendar.tsx` seeds the draft store (`lib/availability.ts`)
   with the current participant's ranges via `setSelections`, and reads it with
   `useSyncExternalStore`. The store is module-level, keyed by `publicId`.
3. Calendar plugins (`dragToCreatePlugin` from @ilamy, plus
   `availabilityResizePlugin` and `swipeNavigationPlugin`) mutate the draft via
   `addSelections` / `moveSelection` / `resizeSelection` / `removeSelection`.
   Every write re-merges overlapping/adjacent ranges within the same browser-local day, so ids can
   disappear after a merge; a move/resize to a zero-length range deletes it.
4. Save calls `useSetAvailability`, which sends the full draft back as instants
   (the server snaps it to the event's grid in the event timezone) and
   invalidates `availabilityKeys.forEvent`.
5. Other participants' ranges feed `lib/availability-density.ts` to build the
   heat-map overlap segments.

Mutations in `queries.ts` own cache invalidation through the `eventKeys` /
`participantKeys` / `availabilityKeys` factories; reuse them rather than
writing raw query keys. Deleting an event uses `removeQueries` (not
invalidation) so the deleted event isn't refetched.
