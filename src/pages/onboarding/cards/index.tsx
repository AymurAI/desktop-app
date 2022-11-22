import { Text } from 'components';
import { CardContainer, Card as StyledCard, Step } from './Cards.styles';

export { CardContainer };

interface Props {
  step: number;
  text: string;
}
/**
 * @param step Current step, used to refer to an image on `/public`
 * @param text Text used to describe current step
 */
export function Card({ step = 1, text }: Props) {
  return (
    <StyledCard>
      <Step>{step}</Step>
      <img src={`/onboarding-steps/step${step}.png`} alt={`Step ${step}`} />
      <Text size="sm">{text}</Text>
    </StyledCard>
  );
}
