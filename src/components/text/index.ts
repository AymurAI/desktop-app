import { styled } from 'styles';

const Text = styled('p', {
  variants: {
    size: {
      m: {
        fontSize: '$paragraphsMd',
        lineHeight: '$paragraphsMd',
      },
      s: {
        fontSize: '$paragraphsSm',
        lineHeight: '$paragraphsSm',
      },
      xs: {
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
    size: 'm',
    weight: 'default',
  },
});

export default Text;
