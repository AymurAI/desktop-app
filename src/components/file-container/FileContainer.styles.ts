import { styled } from 'styles';

const Container = styled('div', {
  p: '$xl',

  boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
  zIndex: 1,

  overflowY: 'scroll',

  '& p, & span, & strong, & em': {
    fontFamily: '$file',
    fontSize: 16,
    lineHeight: '100%',
    my: '1em',
  },
});

export default Container;
