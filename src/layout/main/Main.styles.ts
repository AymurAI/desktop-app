import { styled } from 'styles';

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

export const Container = styled('section', {
  px: 200,
  py: '$l',

  bg: '$bgPrimary',
});

export const Footer = styled('nav', {
  bt: '1px solid $borderPrimary',

  bg: '$bgPrimary',
});
