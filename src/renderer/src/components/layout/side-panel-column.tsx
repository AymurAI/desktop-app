import { cva, cx } from "@/styled/css";
import type { ComponentPropsWithoutRef } from "react";

/**
 * `SidePanelColumn` unifies the two docked-panel implementations that used to
 * disagree on width (Voz a Texto's SidePanel measured 360px fixed, the
 * Anonimizador LabelManager measured 260-400px depending on viewport) even
 * though both are the SAME Figma spec: 479px fixed, docked right, toggleable.
 *
 * Scoped version (tasks/responsive-fixes/plan-version-acotada.md): this
 * primitive carries ONLY what the Figma frames specify, and the frames specify
 * one thing — `sizes.panel.side` (479px), fixed, at 1440/1920/2560. It does not
 * change between those three widths: all the extra room goes to the content
 * pane, which is `ReadingColumn`'s job.
 *
 * There are deliberately NO breakpoints here. Below 1440 the Figma says
 * nothing, so this behaves exactly as it does at 1440 rather than inventing a
 * collapse. The full version of this branch had two of those inventions in
 * turn — a `position: absolute` overlay, then a stacked full-width row with a
 * `panel.sideCompact` (360px) tier at `lg` — and both were extrapolated, not
 * designed. They live on `feature/responsive-screens` if the narrow range ever
 * gets a design.
 *
 * Unlike `ReadingColumn` this primitive has no gutter, so `width` + `maxWidth`
 * live on ONE element with no wrapper — this IS both the styled node and the
 * node consumers attach `data-testid="vtt-side-panel"` /
 * `data-testid="anon-side-panel"` to, via the forwarded `className`/rest props
 * below.
 */
const panel = cva({
  base: {
    position: "static",
    width: "panel.side",
    flexShrink: "0",
    overflowY: "auto",
    bg: "bg.secondary",
    borderLeft: "[1px solid #BCBAB8]",
  },
});

type SidePanelColumnProps = ComponentPropsWithoutRef<"div">;

export default function SidePanelColumn({
  className,
  ...rest
}: SidePanelColumnProps) {
  return <div className={cx(panel(), className)} {...rest} />;
}
