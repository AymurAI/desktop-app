# Conventions (hard rules)

Failure-mode rules for this repo, not style suggestions. The `critic`,
`adversary`, and `gov_reviewer` roles reject code that violates them **even when
the tests pass**. This is a shipped Electron desktop app (AymurAI): assume real
users have existing documents and workflows.

## Gates — never weaken them

- The two gates are `pnpm validate` (biome + `tsc --noEmit` on both the node and
  web projects) and `pnpm test` (vitest). Both must exit 0.
- Never make a gate pass by loosening it: no new `biome.json` rule downgrades,
  no `// biome-ignore` added to silence a real finding, no `tsconfig` loosening,
  no deleting or skipping a failing test. Fix the code.
- Never add `.only(` to a test. Pre-commit blocks it, and it silently disables
  the rest of the file.
- Do not weaken `strictTokens`, `strict` TS mode, or the biome ignore list to
  land a change.

## Package manager

- **pnpm only.** Never run `npm install` or `yarn`; never commit
  `package-lock.json` (it is gitignored and its presence breaks resolution).
- `pnpm-lock.yaml` is authoritative. If you change dependencies, commit the
  updated lockfile in the same commit.
- pnpm 11 enforces supply-chain policy from `pnpm-workspace.yaml`. If a new
  dependency needs build scripts or is newer than the `minimumReleaseAge`
  window, add the **exact** `allowBuilds` / `minimumReleaseAgeExclude` entry in
  the same commit — otherwise `pnpm install` fails for everyone and every gate
  fails with it. `@aymurai/ui` is a git tarball: its `allowBuilds` key must
  match the tarball SHA pinned in `pnpm-lock.yaml`.
- Node is pinned by `.nvmrc` (22) and `engines`. Do not rely on a global that
  only exists on a newer Node.

## Never edit generated output by hand

- `src/renderer/src/styled/**` — Panda CSS codegen. Changing
  `panda.config.ts` requires re-running `pnpm panda codegen`.
- `src/renderer/src/routeTree.gen.ts` — TanStack Router codegen.
- `out/`, `build/`, `.orquestalite/`.

## Styling — Panda CSS

- New and touched code uses Panda (`@/styled/css`, `@/styled/jsx`). Never import
  `@stitches/react` (pre-commit blocks it). `@/styles/stitches.config` is legacy
  debt: migrate any file you touch rather than extending it.
- `strictTokens: true`. Use semantic tokens by dotted path (`color:
  "text.default"`). Raw values require the bracket escape (`width: "[36px]"`).
  Never inline a raw hex without brackets.
- Repeated values become tokens in `panda.config.ts`, not copies across files.
- No Tailwind-style utility class strings — Panda does not parse them.

## Radix / UI primitives

- Feature code imports primitives from `@/components/ui/*`, **never** from
  `@radix-ui/react-*` directly. If a primitive is not wrapped yet, wrap it in
  `ui/` first.
- Never reimplement focus traps, escape handling, click-outside, or `aria-*`
  that Radix already provides.
- Never add `autoFocus` to a dialog input; use `onOpenAutoFocus` to redirect.
- Open/value/checked state lives in the consumer, not inside the `ui/` wrapper.

## Data and routing

- Backend access goes through the query/mutation factories in
  `src/renderer/src/services/aymurai/queries.ts`. Do not scatter ad-hoc
  `useQuery`/`useMutation` calls with inline keys through components — duplicate
  keys silently break cache invalidation.
- Routes are file-based under `src/renderer/src/routes/`.
- Never import from `react-router-dom` (pre-commit blocks it); this app uses
  TanStack Router.

## Electron process boundary

- `src/main` (main), `src/preload` (bridge), `src/renderer` (UI). Renderer code
  must not import Node or Electron main-process APIs directly — cross the
  boundary through preload/IPC. A renderer import of a main-only module builds
  in dev and fails in a packaged app.

## User-facing strings

- Spanish UI strings live in `src/renderer/src/constants/i18n/locales/es/`.
  Never hardcode a user-facing string in a component; add the key to the locale
  file and use i18next.

## Logging

- `console.log` and `debugger` are blocked by pre-commit. Use the existing
  logger (`src/renderer/src/utils/logger.ts`) or `console.info`/`warn`/`error`
  deliberately.

## Correctness rules that have bitten this codebase

- **Existing consumers keep working.** Changing a component's props, a hook's
  signature, or a service's return shape means updating every call site in the
  same change. A partial migration that type-checks because one branch is
  untyped is a defect.
- **No partial updates.** If a change spans schema → service → component →
  locale strings → test, land all of it. Half-applied vertical slices are the
  most common defect class here.
- **Single source of truth for constants** — define once, import everywhere,
  including tests. Never re-declare a literal in a test to make it pass.
- **Validate at the boundary, in depth.** Data arriving from the backend or from
  a parsed document is untrusted: check the fields you read, not just the top
  level object's existence.
- **Join on ids, never on display strings.** Document/label names are not stable
  keys.

## Tests

- Colocated `*.test.ts` / `*.test.tsx` under `src/renderer/src/**` (vitest,
  jsdom). `vitest.config.ts` owns the environment; `src/renderer/src/test/
  setup.ts` owns global shims.
- Self-contained: no network, no running backend, no real filesystem writes
  outside a temp dir, no shared state between files, no sleeps as
  synchronization, no dependence on test ordering.
- A test must **fail if the behavior it asserts regresses**. Vacuous assertions,
  asserts wrapped in try/except, and snapshots regenerated to match new output
  are findings, not tests.
- New behavior lands with its sad paths (empty input, malformed document,
  missing field), not only the happy path.
- Do not depend on Node-version-specific globals. `setup.ts` shims
  `localStorage` precisely because Node ≥24 ships a stub that shadows jsdom's.
