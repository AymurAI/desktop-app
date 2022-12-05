import { styled } from 'styles';

const Subtitle = styled('p', {
  variants: {
    size: {
      m: {
        fontSize: '$subtitleMd',
        lineHeight: '$subtitleMd',
      },
      s: {
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
    size: 'm',
    weight: 'default',
  },
});

export default Subtitle;
