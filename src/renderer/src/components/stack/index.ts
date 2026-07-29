import { styled } from "@/styled/jsx";

/**
 * Stitches -> Panda token mapping measured for this file (values were read
 * from src/renderer/src/styles/tokens.ts, deleted in RSP-12b once nothing
 * imported it any longer - see git history for that file's contents, and
 * .claude/rules/panda-css.md for the recorded mapping - vs
 * node_modules/@aymurai/ui/dist/preset.js):
 * - `direction`/`wrap`/`justify`/`align` are plain CSS values (flexDirection,
 *   flexWrap, justifyContent, alignItems) with no Panda token category, so
 *   they carry over unchanged.
 * - The Stitches space scale (xxs 2 / xs 4 / s 8 / m 16 / l 24 / xl 32 px)
 *   maps to Panda's REM-based `spacing` tokens: xxs -> "0.5" (0.125rem),
 *   xs -> "1" (0.25rem), s -> "2" (0.5rem), m -> "4" (1rem), l -> "6"
 *   (1.5rem), xl -> "8" (2rem) - equal to the legacy px only while the root
 *   font-size stays 16px, the same rem-vs-px shift T18/T19 disclosed for
 *   `fontSizes.md`.
 * - `$textDefault` #110041 is an EXACT match for `colors.text.default`.
 *
 * This keeps the Stitches-era variant API (both call sites and
 * `defaultVariants` unchanged) rather than switching to Panda's own `Stack`
 * pattern from `@/styled/jsx`: that pattern defaults to `direction: column`
 * with no `wrap` support at all, while this component's Stitches original
 * defaulted to a row with `flexWrap: wrap` - adopting it would silently flip
 * both call sites' layout. `Flex` (`@/styled/jsx`) is the faithful target if
 * this is ever inlined at the call sites instead of kept as its own
 * component.
 */
const Stack = styled("div", {
  base: {
    display: "flex",
  },

  variants: {
    direction: {
      row: { flexDirection: "row" },
      column: { flexDirection: "column" },
      "row-reverse": { flexDirection: "row-reverse" },
      "column-reverse": { flexDirection: "column-reverse" },
    },

    wrap: {
      wrap: { flexWrap: "wrap" },
      nowrap: { flexWrap: "nowrap" },
      "wrap-reverse": { flexWrap: "wrap-reverse" },
    },

    justify: {
      start: { justifyContent: "start" },
      end: { justifyContent: "end" },
      center: { justifyContent: "center" },
      "space-between": { justifyContent: "space-between" },
      "space-around": { justifyContent: "space-around" },
      "space-evenly": { justifyContent: "space-evenly" },
    },

    align: {
      start: { alignItems: "start" },
      end: { alignItems: "end" },
      center: { alignItems: "center" },
      stretch: { alignItems: "stretch" },
      baseline: { alignItems: "baseline" },
    },

    spacing: {
      none: { gap: "0" },
      xxs: { gap: "0.5" },
      xs: { gap: "1" },
      s: { gap: "2" },
      m: { gap: "4" },
      l: { gap: "6" },
      xl: { gap: "8" },
    },
    textColor: {
      default: {
        color: "text.default",
      },
    },
  },

  defaultVariants: {
    direction: "row",
    wrap: "wrap",
    justify: "start",
    align: "start",
    spacing: "s",
    textColor: "default",
  },
});

export default Stack;
