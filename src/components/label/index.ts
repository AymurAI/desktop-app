import { styled } from 'styles';

const Label = styled('label', {
  color: '$textLighter',

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
  },
  defaultVariants: {
    size: 'md',
    weight: 'default',
  },
});

export default Label;
