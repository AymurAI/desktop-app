import { Circle } from "phosphor-react";

import { colors } from "styles/tokens";
import * as S from "./RadioGroup.styles";
import type { Radio as SingleRadio } from "./index";

interface RadioProps extends SingleRadio {
	checked: boolean;
	groupName: string;
	onChange: (value: string) => void;
}

export function Radio({
	id,
	label,
	checked,
	disabled,
	groupName,
	onChange,
	value,
}: RadioProps) {
	const iconColor = disabled
		? colors.textOnButtonDisabled
		: colors.textOnButtonAlternative;

	return (
		<S.RadioWrapper hasText={!!label} isDisabled={disabled}>
			<S.Input
				id={id}
				type="radio"
				name={groupName}
				checked={checked}
				disabled={disabled}
				onChange={() => onChange(value)}
			/>
			<S.RadioCircle>
				<Circle color={iconColor} weight="fill" />
			</S.RadioCircle>
			{label}
		</S.RadioWrapper>
	);
}
