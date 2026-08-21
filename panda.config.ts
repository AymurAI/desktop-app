import aymuraiPreset from "@aymurai/ui/preset";
import { defineConfig, defineGlobalStyles } from "@pandacss/dev";
import pandaPreset from "@pandacss/preset-panda";

const globalCss = defineGlobalStyles({
  "*": {
    // was $primary; preset's fonts.primary QUOTES "Helvetica Neue"
    // ('"Archivo", -apple-system, "Helvetica Neue", Helvetica, Roboto,
    // sans-serif', preset.js:37) while this literal leaves it bare, so it is
    // NOT a byte-identical substitution - tokenizing is a deliberate
    // CSS-validity correction (an unquoted multi-word family name is not
    // strictly valid CSS even though browsers tolerate it) (RSP-12e).
    fontFamily: "primary",
  },

  html: {
    // was a raw #110041 literal with no verdict comment - unlike every
    // sibling site here, it never carried a `// TODO: Replace token here`
    // marker, so both RSP-12a's and RSP-12e's audits (scoped by that marker
    // list) missed it. Exact match for the preset's `text.default`
    // (`token("colors.text.default")` === "#110041", asserted in
    // global-styles-tokens.test.ts); tokenizing is byte-identical, confirmed
    // via a `panda cssgen` before/after diff (RSP-12b).
    color: "text.default",
  },

  "mark.predicted-word": {
    // was $primaryAlt; NEAR-MISS (c), same shape as `tabs/index.ts`'s pinned
    // default-tab background - the preset's `bg.primary-alternative` is
    // #E5E8FF, one hex digit off this legacy value. Kept as a raw escape so
    // this migration introduces zero rendered colour change; see the
    // decision at components/tabs/index.ts:17-21 (RSP-12e).
    backgroundColor: "#E6E8FF",
    fontFamily: "file", // was $file, exact match (RSP-12e)
    padding: "0px 0px 0px 2px",
    borderRadius: "8px",

    "& strong": {
      fontSize: "12px",
      padding: "0px",
      margin: "0px",
    },

    "& button.remove-tag": {
      visibility: "hidden",
      position: "relative",
      backgroundColor: "system.error", // was $errorPrimary #DC582E, exact match (RSP-12a)
      color: "text.onbutton-alternative", // was $white #FFFFFF, exact match (RSP-12a)
      padding: "3px 5px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "10px",
      // was $heavy 800; no fontWeights token category in this preset (only
      // 400/600 baked into the textStyle recipes), so it stays literal (RSP-12a)
      fontWeight: 800,
      textAlign: "center",
      top: "-10px",
      right: "-5px",
      border: "none",
    },

    "&:hover": {
      cursor: "pointer",
      "& button.remove-tag": {
        visibility: "visible",
      },
    },
  },

  "mark.searched-word": {
    // was $bgSecondaryAlt; TWO exact preset matches for #E0DDE2 -
    // `action.disabled` and `bg.secondary-highlight`. `bg.secondary-highlight`
    // is the better fit here on both family (`bg.*`) and intent (a
    // highlighted background, not a disabled-state one) grounds; the
    // rejected candidate is `action.disabled` (RSP-12e).
    backgroundColor: "bg.secondary-highlight",
    fontFamily: "file", // was $file, exact match (RSP-12e)
    padding: "0px 2px",
    borderRadius: "8px",

    "&:hover": {
      cursor: "pointer",
    },

    "& button.add-tag": {
      position: "relative",
      backgroundColor: "system.success", // was $successPrimary #1B834E, exact match (RSP-12e)
      color: "text.onbutton-alternative", // was $white #FFFFFF, exact match - same substitution as `button.remove-tag` above (RSP-12e)
      padding: "2px 5px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      // was $heavy 800; no fontWeights token category in this preset (only
      // 400/600 baked into the textStyle recipes), so it stays literal (RSP-12e)
      fontWeight: 800,
      textAlign: "center",
      top: "-10px",
      right: "-5px",
      border: "none",
    },
  },
});

export default defineConfig({
  presets: [pandaPreset, aymuraiPreset],

  // Use CSS reset
  preflight: true,

  // Where to look for CSS declarations
  include: ["./src/renderer/src/**/*.{ts,tsx}"],

  // Files to exclude
  exclude: [],

  // JSX framework
  jsxFramework: "react",

  // Output directory for generated styled-system
  outdir: "src/renderer/src/styled",

  // Global styles (migrated from Stitches globalStyles.ts)
  globalCss,

  // Theme extensions
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          bg: {
            // Dark surface for the Voz a Texto editor's floating selection
            // toolbar. Not in the preset because it's the only dark-surface
            // element in the app.
            "overlay-dark": { value: "#26244A" },
          },
          text: {
            "on-overlay-dark": { value: "#FFFFFF" },
          },
        },
      },
      // Extra breakpoint between the preset's `xl` (1280px) and `2xl`
      // (1536px), for the responsive-layout plan (tasks/responsive/plan.md).
      breakpoints: {
        desktop: "1440px",
      },
      tokens: {
        sizes: {
          content: {
            max: { value: "1824px" },
            split: { value: "1672px" },
            doc: { value: "1520px" },
          },
          panel: {
            side: { value: "479px" },
            form: { value: "594px" },
            sideCompact: { value: "360px" },
          },
        },
      },
    },
  },

  // Other configuration
  strictTokens: true,
});
