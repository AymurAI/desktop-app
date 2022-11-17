import { styled } from 'styles';

const Subtitle = styled('p', {
  variants: {
    size: {
      md: {
        fontSize: '$subtitleMd',
        lineHeight: '$subtitleMd',
      },
      sm: {
        fontSize: '$subtitleSm',
        lineHeight: '$subtitleSm',
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

export default Subtitle;
