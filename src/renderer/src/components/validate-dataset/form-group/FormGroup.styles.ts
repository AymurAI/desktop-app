import { css } from "@/styled/css";

// 64px (spacing "16") at >=desktop, matching the previous flat Stitches
// `gap: 64`; tighter (32px, spacing "8") below that width.
const container = css({
  display: "flex",
  flexDirection: "column",
  gap: { base: "8", desktop: "16" },
});

export default container;
