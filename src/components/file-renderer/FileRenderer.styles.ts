import { styled } from 'styles';

export const Button = styled('button', {
  visibility: 'hidden',
  position: 'relative',
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
  fontFamily: '$file',

  padding: '0px 0px 0px 2px',
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
          margin: '0px',
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
