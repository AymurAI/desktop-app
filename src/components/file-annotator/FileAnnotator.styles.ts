import { styled } from 'styles';

export const Container = styled('div', {
  boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',

  zIndex: 1,
  overflowY: 'scroll',
});

export const File = styled('div', {
  px: '$xl',
  pb: '$xl',

  '& p, & span, & em': {
    fontFamily: '$file',
    fontSize: 16,
    lineHeight: '100%',
    my: '1em',
  },
});

export const Paragraph = styled('p', {
  margin: '8px 0px',
});

export const Button = styled('button', {
  visibility: 'hidden',
  position: 'absolute',
  color: '$white',
  padding: '3px 5px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 'heavy',
  textAlign: 'center',
  top: '-10px',
  right: '-5px',
  border: 'none',

  variants: {
    type: {
      tag: {
        backgroundColor: '$errorPrimary',
        '&::after': {
          content: '-',
        },
      },
      search: {
        backgroundColor: '$successPrimary',
        '&::after': {
          content: '+',
        },
      },
    },
  },
  defaultVariants: {
    type: 'tag',
  },
});
export const Mark = styled('mark', {
  position: 'relative',
  overflowWrap: 'break-word',
  padding: '0px  2px',
  borderRadius: 8,

  [`&:hover ${Button}`]: {
    visibility: 'visible',
  },

  variants: {
    type: {
      tag: {
        backgroundColor: '$primaryAlt',

        '& strong': {
          fontSize: '12px',
          padding: '0px',
          ml: '6px',
        },
      },
      search: {
        backgroundColor: '$bgSecondaryAlt',
      },
    },
    annotable: {
      true: {
        cursor: 'pointer',
      },
      false: {
        cursor: 'default',
      },
    },
  },
  defaultVariants: {
    type: 'tag',
    annotable: false,
  },
});

export const SearchContainer = styled('div', {
  p: '$l',

  zIndex: 1,
  top: 0,
  position: 'sticky',
  background: 'white',
});
