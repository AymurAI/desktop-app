import { useRef } from "react";

import { Checkbox as CheckboxComponent } from "./Checkbox";
import * as S from "./CheckboxGroup.styles";

export interface Checkbox {
	value: string;
	id: string;
	label?: string;
	disabled?: boolean;
}

interface CheckboxGroupProps {
	legend?: string;
	name: string;
	direction?: "horizontal" | "vertical";

	checkboxes: Checkbox[];

	value: Record<Checkbox["id"], boolean>;
	onChange: (value: Record<Checkbox["id"], boolean>) => void;
}
export default function CheckboxGroup({
	legend,
	name,
	direction = "horizontal",
	checkboxes,
	value,
	onChange,
}: CheckboxGroupProps) {
	const fieldsetRef = useRef<HTMLFieldSetElement>(null);

	const handleChange = () => {
		if (!fieldsetRef.current) return;

		const nodeList = fieldsetRef.current.querySelectorAll(
			'input[type="checkbox"]',
		);
		const inputs = Array.from(nodeList) as HTMLInputElement[];

		const entries = inputs
			.filter((node) => node.checked)
			.map((node) => [node.id, node.value]);
		const values = Object.fromEntries(entries);

		onChange(values);
	};
	return (
		<S.Fieldset onChange={handleChange} direction={direction} ref={fieldsetRef}>
			{legend && <S.Legend>{legend}</S.Legend>}

			{checkboxes.map((checkbox) => (
				<CheckboxComponent
					key={checkbox.id}
					id={checkbox.id}
					groupName={name}
					label={checkbox.label}
					value={checkbox.value}
					checked={value[checkbox.id] ?? false}
				/>
			))}
		</S.Fieldset>
	);
}
