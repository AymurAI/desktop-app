import { styled } from 'styles';

export const File = styled('div', {
  p: '$xl',

  '& p, & span, & strong, & em': {
    fontFamily: '$file',
    fontSize: 16,
    lineHeight: '100%',
    my: '1em',
  },
});

export const Container = styled('div', {
  boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',

  zIndex: 1,
  overflowY: 'scroll',
});

export const SearchBarWrapper = styled('div', {
  position: 'sticky',
  top: '-10px',
  zIndex: 1,

  background: '$white',

  '&::before': {
    content: '',
    display: 'block',
    position: 'sticky',
    height: '10px',
    boxShadow: '0px 4px 10px rgb(0 0 0 / 10%)',
    top: '118px',
  },
  '&::after': {
    content: '',
    display: 'block',
    position: 'sticky',
    height: '10px',
    background: 'white',
    top: 0,
    zIndex: 2,
  },
});

export const SearchBarPadding = styled('div', {
  position: 'sticky',
  top: 0,
  background: 'white',

  p: '56px 56px 24px 56px',
  mt: '-10px',
  zIndex: 3,
});
