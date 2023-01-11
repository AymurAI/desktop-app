import { removeUndefined } from 'utils/filtering';
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

/**
 * Re-orders the options array
 * @param options Options array from the JSON file
 * @param priority `id[]` of the options to prioritize
 * @returns A reordered array with the priority options placed on first place
 */
export function orderByPriority(
  options: SelectOption[],
  priority: SelectOption['id'][] = []
) {
  // Remove priority options from the array
  const filtered = options.filter(({ id }) => !priority.find((p) => p === id));

  // Find preferred { id, text } on the original options array
  const preferred = priority
    .map((p) => options.find(({ id }) => p === id))
    .filter(removeUndefined);

  // Add the preferred options
  return [...preferred, ...filtered];
}
