import { styled } from 'styles';

/**
 * Adds the `$secondary` colors
 */
export const Background = styled('main', {
  bg: '$secondary',

  display: 'flex',

  height: '100vh',
});

/**
 * Contains the Login elements and adds the margin
 */
export const Container = styled('div', {
  bg: '$white',

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,

  margin: '$xl',

  border: '1px solid $borderPrimary',
});
