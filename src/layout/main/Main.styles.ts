import { styled } from 'styles';

export const Layout = styled('main', {
  height: '100vh',

  display: 'flex',
  flexDirection: 'column',
});

export const Header = styled('header', {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',

  px: 200,
  py: '$l',
  gap: 10,

  bg: '$white',
  bb: '1px solid $borderPrimary',
});

export const Section = styled('section', {
  px: 200,
  py: '$xxl',
  flex: 1,

  display: 'flex',
  flexDirection: 'column',
  gap: '$m',

  bg: '$bgPrimary',
});

export const Footer = styled('nav', {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '$m',

  p: '$l 100px',

  bt: '1px solid $borderPrimary',

  bg: '$bgSecondary',
});
