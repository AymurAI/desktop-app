import { styled } from 'styles';
import { Button as BaseButton } from 'components';

export const FileStep = styled('div', {
  borderRadius: '$xxs',
  boxSizing: 'border-box',

  display: 'flex',
  flexDirection: 'row',
  gap: '$s',
  alignItems: 'center',

  p: '$m',

  variants: {
    status: {
      completed: {
        color: '$onButtonAlternative',
        bg: '$actionPressed',
      },
      focus: {
        color: '$textOnButtonDefault',
        bg: '$actionFocus',
        boxShadow: '2px 2px 10px rgba(17, 0, 65, 0.25)',
        b: '1px solid $borderPrimaryAlt',
      },
      default: {
        color: '$textOnButtonDefault',
        bg: '$primaryAlt',
      },
    },
  },
  defaultVariants: {
    status: 'default',
  },
});

export const FileName = styled('label', {
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',

  width: 200,

  fontSize: '$labelMd',
  lineHeight: '$labelMd',
});

export const CaretButton = styled(BaseButton, {
  boxShadow: '4px 0px 4px rgba(0, 0, 0, 0.05)',

  // Marked as important because of Stitches hierarchy
  px: '0px !important',
  py: '$s !important',

  '&:disabled': {
    boxShadow: 'none',
    color: '$textLighter',
  },
});

export const Carousel = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  gap: '$s',
  alignItems: 'center',
  wrap: 'no-wrap',
  flex: 1,

  overflowX: 'scroll',
});
