# Radix UI Rules (this repo)

The renderer uses [Radix UI primitives](https://www.radix-ui.com/primitives)
for accessible UI building blocks (dialog, popover, select, switch, tooltip).
Visuals are layered on top with Panda CSS recipes.

## Where primitives live

Most Radix-backed primitives this app uses — Dialog, Popover, Select, Switch,
Tooltip — are **not** wrapped locally. They come straight from `@aymurai/ui`
(`export * from "./components/dialog"` etc. in its `dist/index.d.ts`), which
wraps the matching `@radix-ui/react-*` package itself (verified in its bundle:
`@radix-ui/react-dialog`, `-popover`, `-select`, `-switch`, `-tooltip`).
Feature code imports these directly from `@aymurai/ui` — see
`how-it-works-modal.tsx` (Dialog) and `transcription-editor/turn-side-panel.tsx`
(Popover) for the existing pattern. Do **not** add a local `ui/` wrapper for a
primitive `@aymurai/ui` already exports — that duplicates what the library
provides and is exactly the divergence this rule exists to avoid.

`src/renderer/src/components/ui/` holds only primitives `@aymurai/ui` does
**not** provide:

- `ui/scroll-area.tsx` — wraps `@radix-ui/react-scroll-area`
- `ui/back-button.tsx` — visual only, no Radix dependency

If a future primitive isn't covered by either `@aymurai/ui` or `ui/`, add it to
`ui/` first (see "Adding a new primitive wrapper" below) — but check
`@aymurai/ui`'s exports before doing so.

## Composition pattern (shadcn-style)

Each primitive exports the parts the consumer needs. For a primitive
`@aymurai/ui` already provides (e.g. Dialog):

```tsx
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@aymurai/ui";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>...</DialogTitle>
    ...
  </DialogContent>
</Dialog>
```

For a primitive wrapped locally in `ui/` (e.g. ScrollArea), the same shape
applies but the import comes from `@/components/ui/<name>` instead.

- Open/close state lives in the consumer (`open` + `onOpenChange`).
- Content goes inside the matching `*Content`.
- Don't re-export every Radix part — only what the codebase actually uses.

## Styling

- Each `ui/` file owns its visuals via Panda's `css()` / `cva()` / `sva()`.
- Apply styles via `className={cx(internalStyles, className)}` so callers can
  pass extra utility classes when needed.
- Animations use the `animations` panda tokens (`fadeIn`, `fadeOut`); keyframes
  live in `panda.config.ts theme.extend.keyframes`.

## Accessibility

- Trust Radix to manage focus traps, `aria-*` attributes, escape/click-outside
  behavior. Don't replicate it manually.
- Always pair form primitives with a `<label>` (or `aria-label`).
- Forward `ref` through your wrapper so consumers can use `useRef`.
- Do not add `autoFocus` props to dialog inputs — Radix focuses the first
  focusable element on open. If a different element should be focused, use
  `onOpenAutoFocus` to redirect.

## Adding a new primitive wrapper

0. Check `@aymurai/ui`'s exports first (`export * from` lines in its
   `dist/index.d.ts`). If it already provides the primitive, import it from
   `@aymurai/ui` directly — don't wrap it again in `ui/`.
1. Install the radix package as a devDep (e.g. `pnpm add -D @radix-ui/react-X`).
2. Create `src/renderer/src/components/ui/<name>.tsx` and re-export the parts
   the codebase will use, wrapped in a Panda recipe.
3. Use `forwardRef` if the primitive accepts a ref.
4. Co-locate styles in the same file. If the recipe grows past ~100 lines,
   split into a `ui/<name>.styles.ts`.

## Don'ts

- Don't import `@radix-ui/*` directly from feature code — use `@aymurai/ui`
  if it already wraps that primitive, or `@/components/ui/*` if we wrap it
  locally.
- Don't reimplement focus management, escape handling, or click-outside logic.
- Don't add `autoFocus` to dialog inputs.
- Don't keep state inside `ui/` primitives that should be in the consumer
  (open/value/checked etc.).

## Quick check before reaching for Radix

If the UI is purely visual (a card, a button, a callout), skip Radix and use a
Panda recipe directly. Radix is for primitives that need keyboard/focus/ARIA
choreography.
