import { styled } from 'styles';

export const Wrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  justifyContent: 'start',
  alignItems: 'center',
  gap: '$s',

  position: 'relative',

  // Settings to enable ellipsis on file name
  maxWidth: 150,
  '& p': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
});

export const Card = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',

  height: 200,
  width: 150,

  bg: '$bgPrimary',
  b: '$sizes$xs solid $borderPrimary',
  boxShadow: '0px 0px $sizes$xs rgba(0, 0, 0, 0.1)',
  borderRadius: '$s',
});
