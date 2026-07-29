# Project-local Claude instructions

This repo's renderer (`src/renderer/`) uses:

- **Panda CSS** for styling. See `.claude/rules/panda-css.md`.
- **Radix UI** primitives wrapped under `src/renderer/src/components/ui/`.
  See `.claude/rules/radix-ui.md`.
- **TanStack Router** for file-based routing in `src/renderer/src/routes/`.
- **TanStack React Query** for backend data; query/mutation factories live in
  `src/renderer/src/services/aymurai/queries.ts`.
- **i18next** for Spanish UI strings under
  `src/renderer/src/constants/i18n/locales/es/`.

When adding code to the renderer, the rules above apply. When uncertain about a
library API, prefer `mcp__plugin_context7_context7__query-docs` over guessing
from training data.

## Tooling

- Package manager: **pnpm** (`pnpm-lock.yaml` is authoritative). `npm install`
  is unsupported in this repo.
- `pnpm prepare` runs `panda codegen && lefthook install`. Run after a fresh
  clone or after pulling changes that touch `panda.config.ts`.
- Pre-commit gate (lefthook): biome (autoformat + lint), panda codegen,
  forbidden-pattern grep (`console.log`, `debugger`, leftover merge markers,
  `.only(`, `@stitches/react`).
- Pre-push gate: `pnpm typecheck`. (`pnpm knip` is informational only — every
  rule in `knip.json` is severity `warn`, so it can never fail; it is not part
  of any gate.)

## Migration complete

Stitches CSS-in-JS has been fully replaced by Panda CSS (RSP-08 through
RSP-12e). `src/renderer/src/styles/` (the legacy `stitches.config.ts`,
`tokens.ts`, `globalStyles.ts`, `index.ts`) no longer exists, and
`@stitches/react` is no longer a dependency. See `.claude/rules/panda-css.md`
for the measured Stitches → Panda mapping, kept as the historical record.

Two mechanisms block a `@stitches/react` import, with different coverage:

- `lefthook.yml`'s pre-commit forbidden-pattern grep has **always** blocked
  `from "@stitches/react"`, but only over staged files.
- `biome.json`'s `linter.rules.nursery.noRestrictedImports` rule was added once
  the migration finished, and checks the whole tree on every `pnpm validate`
  — proven to fire against a scratch import.

Both are live; the ban was never actually unenforced, only the whole-tree
(biome) half of it was missing until the migration closed.
