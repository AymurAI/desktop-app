import { cva, cx } from "@/styled/css";
import type { ComponentPropsWithoutRef } from "react";

/**
 * `SidePanelColumn` unifies the two docked-panel implementations that today
 * disagree on width (Voz a Texto's SidePanel measured 360px fixed, the
 * Anonimizador LabelManager measured 260-400px depending on viewport) even
 * though both are the SAME Figma spec: 479px fixed, docked right, toggleable.
 *
 * G1 (tasks/responsive-fixes/issues/G1-paneles-laterales.md): below `lg` this
 * used to be a silent `position: absolute` overlay with no backdrop and no
 * layout reservation - it covered the toolbar/header controls of all three
 * screens with nothing underneath ever moving out of the way (Issues 04/11).
 * Fixed by going STACKED (option (a) over a drawer): the panel is always
 * `position: static` and the two flex parents (Anonimizador's `HStack` at
 * `file-annotator/index.tsx`, Voz a Texto's `content` at
 * `transcription-editor/index.tsx`) switch to `flexDirection: column` below
 * `lg`, so the layout reserves a real row for the panel instead of stacking
 * it visually on top of the document. A drawer (Radix `Dialog`,
 * `.claude/rules/radix-ui.md`) was the other option the contract allowed;
 * stacked was chosen because it needs no new JS state, no focus trap, and no
 * portal - purely CSS over the open/close state that already exists
 * (`labelManagerOpen` / Modo Edición).
 *
 * Below `lg` the panel is a full-width row capped at 50% of its column's
 * height with its own scroll, so a tall LabelManager/SidePanel body never
 * pushes the document to zero height. At/above `lg` it returns to being a
 * static side column exactly as before - `maxWidth` only engages there now,
 * since a flat `maxWidth: "panel.side"` below `lg` is what used to clip the
 * full-width row down to 479px.
 *
 * Unlike `ReadingColumn` this primitive has no gutter, so `width` +
 * `maxWidth` live on ONE element with no wrapper - this IS both the styled
 * node and the node consumers attach `data-testid="vtt-side-panel"` /
 * `data-testid="anon-side-panel"` to, via the forwarded `className`/rest
 * props below.
 */
const panel = cva({
  base: {
    position: "static",
    width: { base: "full", lg: "panel.sideCompact", desktop: "panel.side" },
    maxWidth: { base: "[none]", lg: "panel.side" },
    maxHeight: { base: "[50%]", lg: "[none]" },
    overflowY: "auto",
    bg: "bg.secondary",
    boxShadow: "[none]",
    flexShrink: "0",
    borderLeft: { base: "[none]", lg: "[1px solid #BCBAB8]" },
    borderTop: { base: "[1px solid #BCBAB8]", lg: "[none]" },
  },
});

type SidePanelColumnProps = ComponentPropsWithoutRef<"div">;

export default function SidePanelColumn({
  className,
  ...rest
}: SidePanelColumnProps) {
  return <div className={cx(panel(), className)} {...rest} />;
}
