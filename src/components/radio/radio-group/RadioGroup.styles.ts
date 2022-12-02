import { styled } from 'styles';

export const Legend = styled('legend', {
  fontWeight: '$default',
  fontSize: '$subtitleSm',
  lineHeight: '$subtitleSm',
  color: '$textLighter',

  mb: '$xs',
});

export const Group = styled('fieldset', {
  display: 'flex',
  gap: '$m',

  variants: {
    direction: {
      horizontal: {
        flexDirection: 'row',
      },
      vertical: {
        flexDirection: 'column',
      },
    },
  },
  defaultVariants: {
    direction: 'horizontal',
  },
});
