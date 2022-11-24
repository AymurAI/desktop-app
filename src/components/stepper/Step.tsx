import { Label, Stack } from 'components';
import { styled } from 'styles';

const Number = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',

  width: 36,
  height: 36,

  borderRadius: '100%',

  fontWeight: '$strong',
  fontSize: '$ctaMd',
  lineHeight: '$ctaMd',
  textAlign: 'center',

  variants: {
    status: {
      completed: {
        bg: '$actionDefaultAlt',
        color: '$textOnButtonAlternative',
      },
      focus: {
        bg: '$actionDefault',
        color: '$textOnButtonDefault',
        b: '1px solid $borderPrimaryAlt',
      },
      disabled: {
        bg: '$actionDisabled',
        color: '$textOnButtonDefault',
      },
    },
  },
  defaultVariants: {
    status: 'completed',
  },
});

interface Props {
  currentStep: number;
  step: number;
  children: React.ReactNode;
}
/**
 *
 * @param currentStep Current file validation step, between 0 and 4 (0 being validation process hasn't started)
 * @param step Step number used to get the Step variant and render the number
 * @returns
 */
export default function Step({ currentStep, step, children }: Props) {
  const getStatus = () => {
    if (currentStep === step) return 'focus';
    else if (currentStep > step) return 'completed';
    else return 'disabled';
  };

  return (
    <Stack align="center">
      <Number status={getStatus()}>{step}</Number>
      {getStatus() === 'focus' && <Label>{children}</Label>}
    </Stack>
  );
}
