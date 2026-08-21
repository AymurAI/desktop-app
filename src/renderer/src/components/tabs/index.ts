import { styled } from "@/styled/jsx";

/**
 * Stitches -> Panda token mapping measured for this file (values were read
 * from src/renderer/src/styles/tokens.ts, deleted in RSP-12b once nothing
 * imported it any longer - see git history for that file's contents, and
 * .claude/rules/panda-css.md for the recorded mapping - vs
 * node_modules/@aymurai/ui/dist/preset.js):
 * - `$xxs` (radii, 2px) -> `radii.xs` - NAME SHIFT, Stitches `xxs` is Panda
 *   `xs` (preset scale: xs 2 / sm 4 / md 8 / lg 16 / xl 24 / full).
 * - `$s` (space, 8px) -> spacing `"2"`; `$m` (space, 16px) -> spacing `"4"`.
 * - `$actionPressed` #3F479D -> `action.pressed`.
 * - `$actionFocus` #C5CAFF -> `action.focus`.
 * - `$textOnButtonAlternative` #FFFFFF -> `text.onbutton-alternative`.
 * - `$textOnButtonDefault` #110041 -> `text.onbutton-default`.
 * - `$borderPrimaryAlt` (`1px solid #110041`) -> EXACT composite match,
 *   `borders.primary-alt`.
 * - `b: "none"` -> `border: "[none]"` - `border` is bound to `Tokens["borders"]`
 *   and there is no `none` borders token.
 * - `$primaryAlt` #E6E8FF (default tab background) is ONE HEX DIGIT off the
 *   preset's own `bg.primary-alternative` (#E5E8FF) - the same shape as
 *   FileCheck.styles.ts's #FFECE6/#FFECE5 trap. The exact legacy value is
 *   kept as a raw escape so this migration-only ticket introduces zero
 *   rendered colour change; flag for design alongside that one.
 * - The `focus` status's `boxShadow: 2px 2px 10px rgba(17,0,65,0.25)` has no
 *   matching preset shadow - the closest, `shadows.focus`
 *   (`0px 0px 8px rgba(17,0,65,0.2)`), differs in offset, blur and alpha, so
 *   adopting it would be a visible change. The exact value is kept as a raw
 *   escape; `shadows.focus` is a design-review candidate, not a substitute.
 * - Bare `fontSize: 16` is inherited by label-manager/tab.tsx's unstyled
 *   `<span>` (no other typography today), so it is kept byte-faithful as
 *   `[16px]` rather than promoted to a token/textStyle, which would silently
 *   add a line-height and font-weight that are not there now.
 */
export const Tab = styled("div", {
  base: {
    rounded: "xs",
    boxSizing: "border-box",

    display: "flex",
    flexDirection: "row",
    gap: "2",
    alignItems: "center",

    p: "4",

    fontSize: "[16px]",
  },
  variants: {
    status: {
      completed: {
        "& label, & span": {
          color: "text.onbutton-alternative",
        },
        bg: "action.pressed",
        border: "[none]",
      },
      focus: {
        "& label, & span": {
          color: "text.onbutton-default",
        },
        bg: "action.focus",
        boxShadow: "[2px 2px 10px rgba(17, 0, 65, 0.25)]",
        border: "primary-alt",
      },
      default: {
        "& label, & span": {
          color: "text.onbutton-default",
        },
        bg: "[#E6E8FF]",
        border: "[none]",
      },
    },
  },
  defaultVariants: {
    status: "default",
  },
});

// Stitches `fontSize: $labelMd` / `lineHeight: $labelMd` was 16px/19px;
// `textStyle: "label.md.default"` is 16px/400/120% = 19.2px (+0.2px) - the
// preset recipe is accepted here, same disclosure as FileCheck.styles.ts's
// colour escapes.
export const TabName = styled("label", {
  base: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",

    textStyle: "label.md.default",
  },
});
