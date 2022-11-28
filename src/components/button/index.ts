import { styled } from 'styles';

const Button = styled('button', {
  display: 'flex',
  flexDirection: 'row',
  gap: '$xxs',
  justifyContent: 'center',
  alignSelf: 'stretch',
  alignItems: 'center',

  transitionProperty: 'background-color, color, box-shadow',
  transitionDuration: '0.3s',
  transitionTimingFunction: 'ease',

  borderRadius: '$xs',
  b: 'none',

  fontWeight: 600,
  fontSize: '$ctaMd',
  lineHeight: '$ctaMd',

  cursor: 'pointer',
  '&:disabled': {
    cursor: 'not-allowed',
  },

  variants: {
    variant: {
      primary: {
        color: '$textOnButtonDefault',
        bg: '$actionDefault',

        '&:hover': {
          color: '$textOnButtonAlternative',
          bg: '$actionHover',
        },

        '&:active': {
          color: '$textOnButtonAlternative',
          bg: '$actionPressed',
        },

        '&:focus': {
          boxShadow: '0px 0px 10px rgba(17, 0, 65, 0.2)',
          outline: '2px solid $borderPrimaryAlt',
        },

        '&:disabled': {
          color: '$textOnButtonDefault',
          bg: '$actionDisabled',
        },
      },
      secondary: {
        color: '$textOnButtonDefault',
        bg: '$bgSecondary',

        borderWidth: '$sizes$xxs',
        borderStyle: 'solid',
        borderColor: '$actionDefaultAlt',

        '&:hover': {
          color: '$textOnButtonDefault',
          bg: '$actionHover',
          borderColor: '$actionHover',
        },

        '&:active': {
          color: '$textOnButtonAlternative',
          bg: '$actionPressed',
          borderColor: '$actionPressed',
        },

        '&:focus': {
          boxShadow: '0px 0px 10px rgba(17, 0, 65, 0.2)',
          outline: '2px solid $borderPrimaryAlt',
          bg: '$bgSecondary',
        },

        '&:disabled': {
          color: '$textOnButtonDefault',
          bg: '$bgSecondary',
        },
      },
      none: {
        p: 0,
        bg: 'inherit',
      },
    },
    size: {
      s: {
        p: '$s $m',
      },
      m: {
        p: '$m',
      },
    },
  },
  defaultVariants: {
    size: 'm',
    variant: 'primary',
  },
});

export default Button;
