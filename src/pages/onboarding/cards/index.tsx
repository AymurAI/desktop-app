import { Text } from "components";
import { Step, Card as StyledCard } from "./Cards.styles";

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
			<img
				src={`onboarding-steps/step${step}.png`}
				width="140"
				alt={`Step ${step}`}
			/>
			<Text size="s">{text}</Text>
		</StyledCard>
	);
}
