import { styled } from 'styles';

const Text = styled('p', {
  variants: {
    size: {
      md: {
        fontSize: '$paragraphsMd',
        lineHeight: '$paragraphsMd',
      },
      sm: {
        fontSize: '$paragraphsSm',
        lineHeight: '$paragraphsSm',
      },
      xsm: {
        fontSize: '$paragraphsXsm',
        lineHeight: '$paragraphsXsm',
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

export default Text;
