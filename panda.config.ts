import aymuraiPreset from "@aymurai/ui/preset";
import { defineConfig, defineGlobalStyles } from "@pandacss/dev";
import pandaPreset from "@pandacss/preset-panda";

const globalCss = defineGlobalStyles({
  "*": {
    fontFamily:
      '"Archivo", -apple-system, Helvetica Neue, Helvetica, Roboto, sans-serif', // TODO: Replace token here (was $primary)
  },

  html: {
    color: "#110041",
  },

  "mark.predicted-word": {
    backgroundColor: "#E6E8FF", // TODO: Replace token here (was $primaryAlt)
    fontFamily: '"Times New Roman", Times, serif', // TODO: Replace token here (was $file)
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
      backgroundColor: "#DC582E", // TODO: Replace token here (was $errorPrimary)
      color: "#FFFFFF", // TODO: Replace token here (was $white)
      padding: "3px 5px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "10px",
      fontWeight: 800, // TODO: Replace token here (was $heavy)
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
    backgroundColor: "#E0DDE2", // TODO: Replace token here (was $bgSecondaryAlt)
    fontFamily: '"Times New Roman", Times, serif', // TODO: Replace token here (was $file)
    padding: "0px 2px",
    borderRadius: "8px",

    "&:hover": {
      cursor: "pointer",
    },

    "& button.add-tag": {
      position: "relative",
      backgroundColor: "#1B834E", // TODO: Replace token here (was $successPrimary)
      color: "#FFFFFF", // TODO: Replace token here (was $white)
      padding: "2px 5px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 800, // TODO: Replace token here (was $heavy)
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

  // Other configuration
  strictTokens: true,
});
