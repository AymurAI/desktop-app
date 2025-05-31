import { includes } from "utils/regex";

import type { SelectOption } from "..";

export function filterOptions(options: SelectOption[], inputValue: string) {
	if (!inputValue) return options;

	return options.filter(
		({ label, value }) =>
			label.match(includes(inputValue)) || value.match(includes(inputValue)),
	);
}
