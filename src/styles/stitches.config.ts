import { createStitches, CSS as CSSProp } from '@stitches/react';

import * as tokens from './tokens';

const defaultTheme = createStitches({
  theme: {
    colors: {
      ...tokens.colors,
    },
    fonts: tokens.fonts,
    fontSizes: tokens.fontSizes,
    fontWeights: tokens.fontWeights,
    letterSpacings: {},
    lineHeights: tokens.lineHeights,
    radii: tokens.radii,
    shadows: {},
    sizes: tokens.sizes,
    space: tokens.spaces,
    transitions: {},
  },
});

export const { styled, globalCss, createTheme, theme, keyframes } =
  defaultTheme;
