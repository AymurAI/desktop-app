import { styled } from 'styles';

const Label = styled('label', {
  variants: {
    size: {
      md: {
        fontSize: '$labelMd',
        lineHeight: '$labelMd',
      },
      sm: {
        fontSize: '$labelSm',
        lineHeight: '$labelSm',
      },
    },
    weight: {
      default: {
        fontWeight: '$default',
      },
      strong: {
        fontWeight: '$strong',
      },
    },
    status: {
      default: {
        color: '$textLighter',
      },
      error: {
        color: '$errorPrimary',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'default',
    status: 'default',
  },
});

export default Label;
