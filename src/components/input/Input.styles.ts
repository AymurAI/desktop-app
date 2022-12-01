import { styled } from 'styles';

export const Container = styled('label', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$xs',

  fontWeight: 400,
  fontSize: '$labelSm',
  lineHeight: '$labelSm',

  color: '$textLighter',
});

export const Input = styled('input', {
  display: 'flex',
  flexDirection: 'row',
  gap: '$xl',
  flex: 1,

  p: '$m',

  fontWeight: 400,
  fontSize: '$labelMd',
  lineHeight: '$labelMd',

  bg: '$bgSecondary',
  b: '1px solid $borderPrimary',
  borderRadius: '$xs',

  '&:focus': {
    outline: 'none',
    b: '1px solid $borderPrimaryAlt',
    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.16)',
  },
});
