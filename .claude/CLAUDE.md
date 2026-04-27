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
- Pre-push gate: `pnpm typecheck` and `pnpm knip`.

## Migration in progress

Stitches CSS-in-JS is being replaced by Panda CSS. Files under `components/ui/`,
`components/voice-to-text/`, `components/finish/`, `components/anonymizer/`,
`components/home/`, and `components/layout/` are already on Panda. Older
components (under `components/{checkbox,radio,file-*,validation-form,...}` and
`components/{label,title,text,subtitle,spinner,uncontrolled-input}`) still
import from `@/styles/stitches.config`. Migrate any of these you touch; the
biome rule banning `@stitches/react` is **not yet enabled** because of this
backlog.
