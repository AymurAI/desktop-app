import { styled } from "@/styled/jsx";

// Stitches `$errorPrimary` (#DC582E) is the preset's `system.error` exactly.
// `$subtitleSm` (14px/17px, `$default` = 400 weight) becomes the preset's
// `subtitle.sm.default` textStyle (14px/120% = 16.8px, -0.2px) - percentage
// line-heights are how this preset expresses the scale, so the sub-pixel
// shift is accepted rather than pinning the exact legacy px.
//
// `whiteSpace: "pre-line"` used to be dead: `FileCheck.styles.ts`'s
// `Wrapper` carried a `"& p"` descendant selector (specificity (0,1,1))
// that set `whiteSpace: "nowrap"` and won the cascade against this atomic
// class ((0,1,0)), so the `\n` in `errorMessage` never actually broke the
// line. Now that selector is gone, this takes effect for the first time.
//
// `maxWidth` gives the error a bounded reading column instead of letting it
// stretch to the viewport width (up to 2560px) - single consumer today
// (`file-check/index.tsx`), so a bracket escape rather than a new token
// per CONVENTIONS.md.
const ErrorText = styled("p", {
  base: {
    fontStyle: "italic",
    color: "system.error",
    textAlign: "center",
    textStyle: "subtitle.sm.default",
    whiteSpace: "pre-line",
    maxWidth: "[320px]",
  },
});

export default ErrorText;
