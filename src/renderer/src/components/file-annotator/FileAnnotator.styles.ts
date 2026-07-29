import { css } from "@/styled/css";

export const container = css({
  flex: "1",
  // NOTE (RSP-08): `minW` and `minWidth` both compile to CSS `min-width`, so
  // which one wins depends on generated Panda atomic-class order, not source
  // order - measured (getComputedStyle) to resolve to 520px, i.e. the
  // guardrail below currently wins and is NOT inert. This duplicate
  // shorthand is fragile (a codegen-order change could silently flip it back
  // to 0) - T16 should collapse it to a single declaration.
  minW: "0",
  minH: "0",
  // Guardrail: below this, annotating by clicking words becomes
  // impractical. The entities panel overlays (not shrinks) the document
  // below `lg`, so this should never engage - see RSP-07b.
  //
  // KNOWN HAZARD (RSP-08, flagged for design, not fixed here): when this
  // FileAnnotator is embedded in ValidateDataset's 50/50 `lg` grid fallback
  // (1024-1439, no design exists for that range), the grid track is only
  // 512px at a 1024 viewport - 8px narrower than this guardrail. Measured:
  // the container is forced to 520px while the grid track is 512px, an 8px
  // squeeze the parent `Grid`'s `overflow: hidden` absorbs silently (no
  // horizontal-overflow-probe trip - documentElement.scrollWidth stays
  // exactly the viewport width). The `lg` 50/50 fallback must not change
  // (it's an explicit acceptance criterion), so this is a real but small
  // collision to raise with design rather than resolve unilaterally here.
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
    fontSize: "[16px]",
    lineHeight: "[160%]",
  },
});

export const paragraph = css({
  my: "2",
});
