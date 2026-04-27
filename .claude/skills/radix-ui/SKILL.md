---
name: radix-ui
description: Use when adding or modifying Radix UI primitives in this repo's renderer (dialog, popover, select, switch, tooltip) or wiring accessible interactive components. Triggers on edits under src/renderer/src/components/ui/ or imports from @radix-ui/*.
---

# Radix UI

This repo wraps Radix primitives in `src/renderer/src/components/ui/`. The full
guidelines are in `.claude/rules/radix-ui.md` — read it before adding a new
primitive or refactoring an existing one.

Quick checklist:

1. **Import from `@/components/ui/*`** in feature code, never directly from
   `@radix-ui/react-*`. Wrap missing primitives under `ui/` first.
2. **State stays with the consumer** (`open` + `onOpenChange`). The primitive
   is presentational.
3. **Don't add `autoFocus` to dialog inputs** — Radix manages focus on open;
   use `onOpenAutoFocus` to redirect if a specific element must be focused.
4. **Style with Panda** (`css()`, `cva()`, `sva()`) — see
   `.claude/rules/panda-css.md`. Animations come from panda's `animations`
   tokens.
5. **Forward refs** through the wrapper so `useRef` works in callers.
6. **Trust Radix's a11y**: focus traps, ARIA, escape/outside-click. Don't
   replicate.

For unfamiliar APIs, query the latest docs:
`mcp__plugin_context7_context7__query-docs` with library `radix-ui`.
