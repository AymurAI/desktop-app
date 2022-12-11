import { SelectOption } from '.';

/**
 * Convert a simple text into the id format
 * @param text Text to convert into an id
 * @returns A text converted into an id
 */
export function textToId(text: string) {
  // Transform the text into lowcase
  const lowcase = text.toLowerCase();

  // Replace spaces with underscores
  const spaces = lowcase.replaceAll(' ', '_');

  return spaces;
}

/**
 * Creates a select option based on a text
 * @param text Text to use as a base of the option
 * @returns A new option using a text as a base
 */
export function newOption(text: string): SelectOption {
  return {
    id: textToId(text),
    text,
  };
}

/**
 * Returns or creates a `SelectOption` based on the given text
 * @param text Text to use as a filter
 * @param options Current `SelectOption[]` array
 * @returns Returns the already existent option in the array or creates a new one based on the given text
 */
export function findOption(text: string | undefined, options: SelectOption[]) {
  if (text) {
    return options.find((option) => option.text === text) ?? newOption(text);
  } else {
    return undefined;
  }
}
