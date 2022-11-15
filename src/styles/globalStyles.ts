import { globalCss } from './stitches.config';

export const globalStyles = globalCss({
  '@import':
    'url("https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap")',

  'html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, main, menu, nav, output, ruby, section, summary, time, mark, audio, video':
    {
      margin: '0',
      padding: '0',
      border: '0',
      verticalAlign: 'baseline',
      boxSizing: 'border-box',
      color: '$textDefault',
    },

  '*': {
    fontFamily: '$primary',
  },
});
