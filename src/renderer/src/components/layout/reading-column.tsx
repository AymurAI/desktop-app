import { cva, cx } from "@/styled/css";
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
const gutter = cva({
  base: {
    width: "full",
  },
  variants: {
    variant: {
      full: { px: { base: "4", md: "6", desktop: "12" } },
      split: { px: { base: "4", md: "6", desktop: "12" } },
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
