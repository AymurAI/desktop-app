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
 * Returns a `SelectOption` based on the given `id`
 * @param id ID to use as a filter
 * @param options Current `SelectOption[]` array
 * @returns Returns the already existent option in the array or `undefined` if it doesn't exist on the array
 */
export function findById(
  id: SelectOption['id'] | undefined,
  options: SelectOption[]
) {
  return options.find((op) => op.id === id);
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
