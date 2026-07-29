import { css } from "@/styled/css";

export const container = css({
  flex: "1",
  minH: "0",
  // Guardrail: below this, annotating by clicking words becomes
  // impractical. The entities panel overlays (not shrinks) the document
  // below `lg`, so this should never engage - see RSP-07b.
  //
  // Used to be duplicated as `minW: "0"` alongside this `minWidth`, both
  // compiling to CSS `min-width` - which one won depended on generated Panda
  // atomic-class order, not source order. Collapsed to this single
  // declaration (RSP-12c); nothing depended on the `0` here for flex
  // shrinking, since `flex: "1"` above only needs a flex-basis, not a
  // min-width, to shrink, and the parent `HStack` (file-annotator/index.tsx)
  // already carries its own `minW: "0"` for that purpose.
  //
  // KNOWN HAZARD (RSP-08, flagged for design, consciously accepted rather
  // than fixed - RSP-12c re-measured and confirmed it's unchanged): when this
  // FileAnnotator is embedded in ValidateDataset's 50/50 `lg` grid fallback
  // (1024-1439, no design exists for that range), the grid track is only
  // 512px at a 1024 viewport - 8px narrower than this guardrail. Measured:
  // the container is forced to 520px while the grid track (and the
  // FileAnnotator root `HStack`, which is the actual grid item) stays at
  // 512px, an 8px squeeze that `HStack`'s own `overflow: hidden` absorbs
  // silently (no horizontal-overflow-probe trip - documentElement.scrollWidth
  // stays exactly the viewport width). Fixing this would mean either
  // shrinking the guardrail below 520px (defeats its purpose: annotating by
  // clicking words becomes impractical below it) or changing the `lg` 50/50
  // fallback (an explicit RSP-08 acceptance criterion with no design behind
  // it) - both out of scope for a code-only ticket, so this stays a real but
  // small (8px, silently absorbed, never visible as page overflow) collision
  // for design to weigh in on, not something to resolve unilaterally here.
  minWidth: "[520px]",
  zIndex: "1",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const file = css({
  flex: "1",
  minH: "0",
  minW: "0",
  overflowY: "auto",
  overflowX: "hidden",
  pb: "8",

  // Horizontal gutter/cap now come from ReadingColumn (RSP-07b), nested
  // inside this scroll container - not from padding here.
  "& p, & span, & em": {
    fontFamily: "file",
    // 16px/160% (=25.6px) has no matching preset textStyle - the closest,
    // `paragraph.sm` (16px/140%=22.4px), would shift the line-height, so this
    // stays a raw escape rather than adopting a textStyle (RSP-12a). Mirrored
    // verbatim by summarizer/document-search-panel.tsx's `paragraphText`.
    fontSize: "[16px]",
    lineHeight: "[160%]",
  },
});

export const paragraph = css({
  my: "2",
});
