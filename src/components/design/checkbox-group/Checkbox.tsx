import { Check } from "phosphor-react";

import { colors } from "styles/tokens";

import * as S from "./CheckboxGroup.styles";
import type { Checkbox as SingleCheckbox } from "./index";

interface CheckboxProps extends SingleCheckbox {
	checked: boolean;
	groupName: string;
}

export function Checkbox({
	id,
	checked,
	disabled,
	groupName,
	value,
	label,
}: CheckboxProps) {
	const iconColor = disabled
		? colors.textOnButtonDisabled
		: colors.textOnButtonAlternative;
	return (
		<S.CheckboxWrapper hasText={!!label} isDisabled={disabled}>
			<S.Input
				type="checkbox"
				id={id}
				defaultChecked={checked}
				disabled={disabled}
				value={value}
				name={groupName}
			/>
			<S.Checkbox>
				<Check color={iconColor} weight="bold" />
			</S.Checkbox>
			{label}
		</S.CheckboxWrapper>
	);
}
