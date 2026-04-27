# Radix UI Rules (this repo)

The renderer uses [Radix UI primitives](https://www.radix-ui.com/primitives)
for accessible UI building blocks (dialog, popover, select, switch, tooltip).
Visuals are layered on top with Panda CSS recipes.

## Where primitives live

All wrapped primitives are exported from `src/renderer/src/components/ui/`:

- `ui/dialog.tsx` — wraps `@radix-ui/react-dialog`
- `ui/popover.tsx` — wraps `@radix-ui/react-popover`
- `ui/select.tsx` — wraps `@radix-ui/react-select`
- `ui/switch.tsx` — wraps `@radix-ui/react-switch`
- `ui/tooltip.tsx` — wraps `@radix-ui/react-tooltip`
- Plus visual primitives without a Radix dependency: `button`, `card`, `input`,
  `back-button`, `callout`, `suggestion`, `toast`.

Feature code imports from `@/components/ui/*`, **never** directly from
`@radix-ui/react-*`. If a primitive isn't wrapped yet, add it to `ui/` first.

## Composition pattern (shadcn-style)

Each primitive exports the parts the consumer needs:

```tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>...</DialogTitle>
    ...
  </DialogContent>
</Dialog>
```

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

1. Install the radix package as a devDep (e.g. `pnpm add -D @radix-ui/react-X`).
2. Create `src/renderer/src/components/ui/<name>.tsx` and re-export the parts
   the codebase will use, wrapped in a Panda recipe.
3. Use `forwardRef` if the primitive accepts a ref.
4. Co-locate styles in the same file. If the recipe grows past ~100 lines,
   split into a `ui/<name>.styles.ts`.

## Don'ts

- Don't import `@radix-ui/*` directly from feature code.
- Don't reimplement focus management, escape handling, or click-outside logic.
- Don't add `autoFocus` to dialog inputs.
- Don't keep state inside `ui/` primitives that should be in the consumer
  (open/value/checked etc.).

## Quick check before reaching for Radix

If the UI is purely visual (a card, a button, a callout), skip Radix and use a
Panda recipe directly. Radix is for primitives that need keyboard/focus/ARIA
choreography.
