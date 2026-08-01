import { css, cva, cx } from "@/styled/css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * The three reading-column rules from tasks/responsive/plan.md, encoded as
 * pure tokens - no media queries beyond the responsive `px` object, since
 * `desktop` already sits at the right breakpoint (T1).
 *
 * GEOMETRY CONTRACT (T17): rule A/B's gutter and cap cannot live on the same
 * element. Panda's `preflight: true` sets `box-sizing: border-box`, so a
 * `maxWidth` and a `px` on one node only agree with rule A's number at ONE of
 * the two target widths - measured on the previous (single-element) shape,
 * variant `full` mounted full-bleed:
 *   1440: border-box 1440px / content-box 1344px
 *   1920: border-box 1824px / content-box 1728px
 *   2560: border-box 1824px / content-box 1728px
 * Rule A wants 1344 at 1440 (the CONTENT-box number there, since the cap
 * hasn't engaged yet) and 1824 at 1920/2560 (the BORDER-box number there,
 * since the cap has engaged and consumes the box before padding) - two
 * different quantities on the same node.
 *
 * Fix: every variant renders the SAME two nested elements - the tree shape
 * must stay constant across variants, since callers (FileAnnotator, RSP-07b)
 * flip `variant` at runtime and React unmounts a subtree whenever the
 * element type at a given position changes across a rerender. The OUTER node
 * carries only the responsive gutter (`px`, no cap) for `full`/`split`, and
 * no padding at all for `doc` (rule C has no gutter). The INNER node - "the
 * element that carries the cap" - has `width: full`, `mx: auto` and NO
 * padding of its own, so its border-box and content-box are identical and
 * both equal `min(<available width>, <cap>)` at every viewport; for `full`/
 * `split` that cap is `maxWidth: <token>`, for `doc` it's the rule-C
 * percentage-of-pane width. `className` and any forwarded props (including
 * `data-testid`) land on THIS inner node - it is the one downstream tickets
 * (T8/T10) must measure and attach `data-testid` to.
 */
// Shared with `readingInset` below - the SAME object, not a copy, so rule
// A/B's gutter has one source of truth regardless of whether a consumer
// gets it via `ReadingColumn`'s two-node shape or via the single-value
// expression (G5 T1: `@aymurai/ui`'s `Toolbar` renders one root and can't
// use the two-node shape at all).
const READING_GUTTER = { base: "4", md: "6", desktop: "12" } as const;

const gutter = cva({
  base: {
    width: "full",
  },
  variants: {
    variant: {
      full: { px: READING_GUTTER },
      split: { px: READING_GUTTER },
      doc: {},
    },
  },
});

const cap = cva({
  base: {
    width: "full",
    mx: "auto",
  },
  variants: {
    variant: {
      full: { maxWidth: "content.max" },
      split: { maxWidth: "content.split" },
      doc: { width: "[min(88%, token(sizes.content.doc))]" },
    },
  },
});

export type ReadingColumnVariant = "full" | "split" | "doc";

// `doc` has no gutter of its own (rule C is a pane percentage - see the
// class-level docblock above), so it has no matching cap TOKEN either;
// `readingInset` only makes sense for the two variants that combine a
// gutter with a token cap.
type InsetVariant = Exclude<ReadingColumnVariant, "doc">;

const READING_CAP_TOKEN: Record<InsetVariant, string> = {
  full: "content.max",
  split: "content.split",
};

/**
 * `max(<gutter>, calc((100% - <cap>) / 2))`, for single-node consumers that
 * cannot render `ReadingColumn`'s own two-node (gutter-node wrapping
 * capped-node) shape - e.g. a third-party component that owns its whole
 * root and only exposes a `className` prop (G5 T1: `@aymurai/ui`'s
 * `Toolbar`). Below the cap's engagement width this reduces to the plain
 * gutter (`max` picks the gutter, since the calc term is negative); above
 * it, to the centered inset the cap produces.
 *
 * Verified against the six target widths: gutter alone gives
 * 24/24/24/48/48 at 768/1024/1366/1440/1920 (variant `full`, `md`/`desktop`
 * breakpoints), and the calc term takes over at 2560 (368, cap 1824). For
 * variant `split` inside Modo Edición, `100%` resolves against the
 * containing pane (`bodyColumn`), not the viewport - at 2560 that pane is
 * 2081px wide, giving (2081 - 1672) / 2 = 204.5, matching the reading
 * column measured in that mode. Both `full` and `split` share the SAME
 * `READING_GUTTER` object `ReadingColumn` itself uses - not a copy - and
 * the cap is one of the two existing `sizes.content.*` tokens, never a new
 * number.
 *
 * CALLER CONSTRAINT, verified empirically (built the CT bundle and grepped
 * its compiled CSS - see G5 T1's commit): `@pandacss/dev`'s postcss plugin
 * statically extracts `css()`/`cva()` calls from source within its
 * `include` glob, but it only resolves a call to a plain user-defined
 * function like this one when BOTH (a) the call site is in the SAME FILE
 * this function is defined in, and (b) its argument is a literal. A call
 * from a DIFFERENT file - `readingInset(readingVariant)` or even
 * `readingInset("full")` written in some *other* module - generates a
 * class name string at runtime with ZERO matching CSS behind it (confirmed:
 * the class appears in the DOM, grepping the built stylesheet for it finds
 * nothing, and `getComputedStyle` shows the override never applied). This
 * is why `readingInsetToolbarOverride` below - the thing other files
 * actually consume - is built HERE, in this file, and exports ready-made
 * class name strings rather than making every consumer call `readingInset`
 * itself.
 */
export function readingInset(
  variant: InsetVariant,
): Record<keyof typeof READING_GUTTER, `[${string}]`> {
  const capToken = READING_CAP_TOKEN[variant];
  // Typed as the bracket-escape template literal (`[${string}]`), not plain
  // `string` - Panda's style props require that exact shape
  // (`WithEscapeHatch<T> = T | \`[${string}]\` | ...`, prop-type.d.ts) to
  // accept an arbitrary CSS value like `max(...)`/`calc(...)`.
  const expression = (gutterToken: string): `[${string}]` =>
    `[max(token(spacing.${gutterToken}), calc((100% - token(sizes.${capToken})) / 2))]`;

  return {
    base: expression(READING_GUTTER.base),
    md: expression(READING_GUTTER.md),
    desktop: expression(READING_GUTTER.desktop),
  };
}

/**
 * Ready-made `"&&"` (double-class, specificity (0,2,0)) override per
 * variant, built from `readingInset` right above - see this file's own
 * "CALLER CONSTRAINT" note for why the `css()` call has to live HERE rather
 * than at each consumer. `"&&"` is what a single-node consumer needs when
 * its `className` lands on the SAME root as the library's own conflicting
 * utility class at equal (0,1,0) specificity (G5 T1: `@aymurai/ui`'s
 * `Toolbar` hardcodes `px: "12"` on the root it also appends `className`
 * to) - it is NOT the right shape for every consumer (G5 T2's
 * `AudioPlayer` wrapper still needs a child combinator, since the padding
 * has to land on the library-owned child root rather than on our wrapper),
 * so this is intentionally exported as `...ToolbarOverride`, not a generic
 * "the" override.
 */
export const readingInsetToolbarOverride: Record<InsetVariant, string> = {
  full: css({ "&&": { paddingInline: readingInset("full") } }),
  split: css({ "&&": { paddingInline: readingInset("split") } }),
};

/**
 * CORRECTION, measured empirically (built the CT bundle, inspected the
 * compiled CSS and `getComputedStyle` - same method as this file's own
 * "CALLER CONSTRAINT" note): a plain child selector like `"& > *"` does
 * NOT out-specificity the library's own utility class. Combinators (`>`,
 * `+`, `~`, the descendant space) and the universal selector `*` contribute
 * NOTHING to CSS specificity - `.wrapper > *` computes to (0,1,0), the exact
 * same bucket as the library's own class-based utility, so it is a tie
 * resolved by source order, and `@aymurai/ui/styles.css` (imported after
 * our own `index.css` in `main.tsx`, same mechanism as
 * `readingInsetToolbarOverride`) wins it. MEASURED: with a bare `"& > *"`
 * override, `getComputedStyle(playerRoot).paddingLeft` stayed at the
 * library's hardcoded 48px at every width - the override class existed
 * with real CSS behind it (unlike this file's cross-file trap), it just
 * lost the cascade tie. So `"&&"` (double-class, (0,2,0)) IS needed here
 * too, same mechanism as the Toolbar override, just combined with the
 * child combinator (`"&& > *"`) since the padding has to land on the
 * wrapper's CHILD (the library's own root), not the wrapper itself.
 *
 * SECOND CORRECTION, also measured: `AudioPlayer`'s wrapper sits OUTSIDE
 * `bodyColumn` (the pane) at full viewport width, while the Toolbar sits
 * INSIDE it - so `readingInset`'s `100%` resolves against a DIFFERENT
 * container in each case. For variant `full` there is no side panel at any
 * width, so the pane equals the viewport and reusing `readingInset("full")`
 * verbatim is correct (measured: 368px at 2560, matching the reading
 * column). For variant `split` the side panel (`SidePanelColumn`) eats into
 * the pane's width but not the player's own `100%` - reusing
 * `readingInset("split")` verbatim measured 444px at 2560
 * ((2560 - content.split) / 2), not the reading column's actual 204.5px
 * ((2560 - 479 - content.split) / 2, pane = viewport minus the 479px side
 * panel). `playerSplitInset` below subtracts the side panel's own width per
 * breakpoint - mirroring `side-panel-column.tsx`'s tiers: the panel is
 * stacked below the pane (consumes no row width) below `lg` (1024), then
 * `panel.sideCompact` (360) from `lg` up to `desktop`, then `panel.side`
 * (479) from `desktop` (1440) up - a FOURTH breakpoint tier (`lg`) that
 * `readingInset`'s own gutter object doesn't need, since the gutter itself
 * only changes at `md` and `desktop`. Verified against all six target
 * widths: 24/24/24/48/48/204.5 at 768/1024/1366/1440/1920/2560 - matching
 * `readingInsetToolbarOverride`'s own table exactly.
 */
const PLAYER_SPLIT_CAP = READING_CAP_TOKEN.split;
function playerSplitInset(): Record<
  "base" | "md" | "lg" | "desktop",
  `[${string}]`
> {
  const term = (gutterToken: string, panelToken?: string): `[${string}]` =>
    panelToken
      ? `[max(token(spacing.${gutterToken}), calc((100% - token(sizes.${panelToken}) - token(sizes.${PLAYER_SPLIT_CAP})) / 2))]`
      : `[max(token(spacing.${gutterToken}), calc((100% - token(sizes.${PLAYER_SPLIT_CAP})) / 2))]`;

  return {
    base: term(READING_GUTTER.base),
    md: term(READING_GUTTER.md),
    lg: term(READING_GUTTER.md, "panel.sideCompact"),
    desktop: term(READING_GUTTER.desktop, "panel.side"),
  };
}

/**
 * Ready-made `"&& > *"` (specificity (0,2,0) on the wrapper, applied to its
 * single child) override per variant, for a consumer that wraps a
 * third-party root in its OWN plain `<div>` with no competing class of its
 * own (G5 T2: `@aymurai/ui`'s `Player` doesn't accept a `className` at
 * all - re-confirmed in `dist/components/player/Player.d.ts` - so the only
 * way to align its content to the reading column is a wrapper `<div>`
 * around it, with the inset applied to the wrapper's single child). See
 * this file's "CORRECTION" note right above for why `"&&"` IS required
 * here (a bare `"& > *"` measured as a no-op, tying with and losing to the
 * library's own utility class) and why `split` uses its own
 * `playerSplitInset` formula rather than `readingInset("split")` verbatim
 * (the player sits outside the pane the toolbar's version of that formula
 * assumes). Built from `readingInset`/`playerSplitInset` HERE, in this
 * file, for the same reason `readingInsetToolbarOverride` is - see this
 * file's "CALLER CONSTRAINT" note.
 */
export const readingInsetChildOverride: Record<InsetVariant, string> = {
  full: css({ "&& > *": { paddingInline: readingInset("full") } }),
  split: css({ "&& > *": { paddingInline: playerSplitInset() } }),
};

interface ReadingColumnProps extends ComponentPropsWithoutRef<"div"> {
  variant?: ReadingColumnVariant;
  children: ReactNode;
}

export default function ReadingColumn({
  variant = "full",
  children,
  className,
  ...rest
}: ReadingColumnProps) {
  return (
    <div className={gutter({ variant })}>
      <div className={cx(cap({ variant }), className)} {...rest}>
        {children}
      </div>
    </div>
  );
}
