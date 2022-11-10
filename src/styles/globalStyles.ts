import { globalCss } from './stitches.config';

export const globalStyles = globalCss({
  '@import':
    'url("https://fonts.googleapis.com/css2?family=Archivo:wght@400;600&display=swap")',

  'html, body': {
    margin: 0,
    body: 0,
    color: '$textDefault',
  },

  '*': {
    fontFamily: '$primary',
  },
});
