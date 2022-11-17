import { styled } from 'styles';

const Title = styled('h1', {
  variants: {
    size: {
      default: {
        fontSize: '$titleMd',
        lineHeight: '$titleMd',
      },
      main: {
        fontSize: '$titleMain',
        lineHeight: '$titleMain',
      },
    },
    weight: {
      default: {
        fontWeight: '$default',
      },
      strong: {
        fontWeight: '$strong',
      },
      heavy: {
        fontWeight: '$heavy',
      },
    },
  },
  defaultVariants: {
    weight: 'default',
    size: 'default',
  },
});

export default Title;
