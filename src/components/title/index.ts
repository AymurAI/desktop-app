import { styled } from 'styles';

const Title = styled('h1', {
  fontSize: '$titleMd',
  lineHeight: '$titleMd',

  variants: {
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
    weight: 'default',
  },
});

export default Title;
