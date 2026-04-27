---
name: panda-css
description: Use when authoring or refactoring styles in the Electron renderer of this repo. Triggers on edits to .tsx files that import from @/styled/css or @/styled/jsx, when adding tokens to panda.config.ts, or when migrating Stitches code to Panda.
---

# Panda CSS

This repo's styling stack is Panda CSS. Read the full reference at
`.claude/rules/panda-css.md` — it lists tokens, text styles, escape syntax, and
the Stitches → Panda migration table.

Quick checklist when you're about to touch styling:

1. **Pick the right tool**: `css()` for one-offs, `cva()` for variants, `sva()`
   for slot recipes. Layout uses `<Stack>` / `<HStack>` / `<Grid>` from
   `@/styled/jsx`.
2. **strictTokens is on**. Raw values need `[bracket]` escape (e.g.
   `width: "[36px]"`).
3. **Use semantic tokens** for colors (`text.default`, `bg.secondary`,
   `brand.primary`) — never raw hex unless bracketed.
4. **Run `pnpm panda codegen`** after editing `panda.config.ts` (lefthook
   handles this on commit, but the IDE needs it to type-check).
5. **Don't import from `@stitches/react`**. Migrate any Stitches code you touch.

For unfamiliar APIs, query the latest docs:
`mcp__plugin_context7_context7__query-docs` with library `panda-css`.
