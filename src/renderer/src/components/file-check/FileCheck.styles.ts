import { styled } from "@/styled/jsx";

// Stitches `$s` (space) is 8px -> Panda spacing "2"; radii `$s` (8px) ->
// `rounded: "md"` (preset radii xs=2/sm=4/md=8/lg=16).
export const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: "2",

    position: "relative",

    // Settings to enable ellipsis on file name
    maxWidth: "[150px]",
    "& p": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "full",
      textAlign: "center",
    },
  },
});

// `$sizes$xs` (4px) is used here for BOTH `borderWidth` and the shadow
// blur; `borderWidth`/`boxShadow` are not restricted to a sizes token in
// this preset's border/shadow categories the way width/height are, so the
// 4px values are raw escapes rather than a numeric spacing token. There is
// NO `colors.border.*` token here (only composite `borders.*`, all fixed at
// 1px) so the false-state `$borderPrimary` (#BCBAB8) border color is also a
// raw escape - the same escape RSP-05/RSP-06 already use for this colour.
// `$errorPrimary` (#DC582E) is the preset's `system.error` exactly, but
// `$errorSecondary` (#FFECE6) is ONE HEX DIGIT off the preset's own
// `system.error-secondary` (#FFECE5); the exact legacy value is kept as a
// raw escape so this migration-only ticket introduces no rendered colour
// change, even an imperceptible one.
export const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",

    height: "[200px]",
    width: "[150px]",

    borderWidth: "[4px]",
    borderStyle: "solid",
    borderRadius: "md",
    boxShadow: "[0px_0px_4px_rgba(0,0,0,0.1)]",
  },
  variants: {
    hasError: {
      true: {
        bg: "[#FFECE6]",
        borderColor: "system.error",
      },
      false: {
        bg: "bg.primary",
        borderColor: "[#BCBAB8]",
      },
    },
  },
  defaultVariants: {
    hasError: false,
  },
});
