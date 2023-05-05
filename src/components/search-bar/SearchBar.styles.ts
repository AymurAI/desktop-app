import { styled } from 'styles';

export const Wrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  gap: '$s',

  p: 12,
  height: 48,

  bg: '$bgSecondary',
  border: '1px solid $borderPrimary',
  borderRadius: '$xl',

  '&:focus-within': {
    border: '1px solid $borderPrimaryAlt',
    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.16)',
  },
});

export const Input = styled('input', {
  fontSize: '$labelMd',
  lineHeight: '$LabelMd',
  color: '$textDefault',

  p: 0,
  border: 'none',
  outline: 'none',
});
