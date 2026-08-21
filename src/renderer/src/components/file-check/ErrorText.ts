import { styled } from "@/styled/jsx";

// Stitches `$errorPrimary` (#DC582E) is the preset's `system.error` exactly.
// `$subtitleSm` (14px/17px, `$default` = 400 weight) becomes the preset's
// `subtitle.sm.default` textStyle (14px/120% = 16.8px, -0.2px) - percentage
// line-heights are how this preset expresses the scale, so the sub-pixel
// shift is accepted rather than pinning the exact legacy px.
const ErrorText = styled("p", {
  base: {
    fontStyle: "italic",
    color: "system.error",
    textAlign: "center",
    textStyle: "subtitle.sm.default",
    whiteSpace: "pre-line",
  },
});

export default ErrorText;
