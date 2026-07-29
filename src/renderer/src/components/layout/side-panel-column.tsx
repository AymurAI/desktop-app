import { cva, cx } from "@/styled/css";
import type { ComponentPropsWithoutRef } from "react";

/**
 * `SidePanelColumn` unifies the two docked-panel implementations that today
 * disagree on width (Voz a Texto's SidePanel measured 360px fixed, the
 * Anonimizador LabelManager measured 260-400px depending on viewport) even
 * though both are the SAME Figma spec: 479px fixed, docked right, toggleable.
 *
 * Below `lg` there is no room for a static column, so the panel becomes an
 * `absolute` overlay pinned to the right edge instead of shrinking the
 * sibling content - this requires the PARENT to be `position: relative`, and
 * neither current consumer has that today:
 *   - Anonimizador: the `HStack` at `file-annotator/index.tsx:235` (T9 adds it)
 *   - Voz a Texto: `content` at
 *     `transcription-editor/index.tsx:60-65` (T7 adds it) - this is the flex
 *     row rendered at `index.tsx:353` that holds `bodyColumn` and
 *     `TurnSidePanel`. NOTE `body` at `transcription-editor/index.tsx:49-58`
 *     already has `position: relative`, but it is the WRONG node: the
 *     overlay's containing block must be the row that also holds the
 *     content it overlays, not an ancestor further up.
 *
 * Unlike `ReadingColumn` this primitive has no gutter, so `width` +
 * `maxWidth` live on ONE element with no wrapper - this IS both the styled
 * node and the node T7/T9 must attach `data-testid="vtt-side-panel"` /
 * `data-testid="anon-side-panel"` to, via the forwarded `className`/rest
 * props below.
 */
const panel = cva({
  base: {
    position: { base: "absolute", lg: "static" },
    inset: "0",
    left: "[auto]",
    zIndex: "10",
    width: { base: "full", lg: "panel.sideCompact", desktop: "panel.side" },
    maxWidth: "panel.side",
    bg: "bg.secondary",
    boxShadow: { base: "[-4px_0px_16px_rgba(0,0,0,0.16)]", lg: "[none]" },
    flexShrink: "0",
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
