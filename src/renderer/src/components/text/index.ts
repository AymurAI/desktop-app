import { styled } from "@/styled/jsx";

// This component's only live call site is `file-check/index.tsx:23`
// (`size="s"`), so `size="m"`/`size="xs"`, `weight="strong"` and non-default
// `textColor` have zero consumers today - the full variant API is preserved
// anyway rather than narrowed, since the barrel re-export at
// `components/index.ts:13` is still a real (if currently unused) public
// shape, and retiring it is a separate call for T16's audit, not this
// migration.
//
// The preset bundles fontSize+lineHeight+fontWeight per Figma size into one
// `paragraph.<size>.<weight>` textStyle rather than exposing them as
// independent tokens, so `size`+`weight` are combined via compoundVariants
// instead of Stitches' two independent variant groups. Sizes are exact for
// `m` (18px/150%=27px) and `xs` (10px/140%=14px); `s` shifts by a fraction
// of a pixel (16px/140%=22.4px vs Stitches' flat 22px, +0.4px) because this
// preset expresses line-height as a percentage - accepted as equivalent.
const Text = styled("p", {
  base: {
    color: "text.default",
  },
  variants: {
    size: {
      m: {},
      s: {},
      xs: {},
    },
    weight: {
      default: {},
      strong: {},
    },
    textColor: {
      default: {
        color: "text.default",
      },
    },
  },
  compoundVariants: [
    {
      size: "m",
      weight: "default",
      css: { textStyle: "paragraph.md.default" },
    },
    { size: "m", weight: "strong", css: { textStyle: "paragraph.md.strong" } },
    {
      size: "s",
      weight: "default",
      css: { textStyle: "paragraph.sm.default" },
    },
    { size: "s", weight: "strong", css: { textStyle: "paragraph.sm.strong" } },
    {
      size: "xs",
      weight: "default",
      css: { textStyle: "paragraph.xsm.default" },
    },
    {
      size: "xs",
      weight: "strong",
      css: { textStyle: "paragraph.xsm.strong" },
    },
  ],
  defaultVariants: {
    size: "m",
    weight: "default",
    textColor: "default",
  },
});

export default Text;
