import { Radio as RadioComponent } from "./Radio";
import * as S from "./RadioGroup.styles";

export interface Radio {
	value: string;
	id?: string;
	label?: string;
	disabled?: boolean;
}
interface RadioGroupProps {
	radios: Radio[];
	name: string;
	legend?: string;
	direction?: "horizontal" | "vertical";

	// Is either a null value (nothing selected) or a string (the value of `Radio[].value`)
	value: string | null;
	onChange: (value: string) => void;
}

export default function RadioGroup({
	value,
	radios,
	legend,
	name,
	direction = "horizontal",
	onChange,
}: RadioGroupProps) {
	return (
		<S.FieldsetGroup direction={direction}>
			{legend && <S.FieldsetLegend>{legend}</S.FieldsetLegend>}

			{radios.map((radio) => (
				<RadioComponent
					key={radio.value}
					groupName={name}
					checked={radio.value === value}
					value={radio.value}
					id={radio.id}
					label={radio.label}
					disabled={radio.disabled}
					onChange={onChange}
				/>
			))}
		</S.FieldsetGroup>
	);
}
