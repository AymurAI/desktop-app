import { DocFile } from 'types/file';

/**
 * Toggles the `selected` property of a `DocFile` object
 * @param `DocFile` to toggle
 * @returns A new object with its `selected` property toggled
 */
export default function toggleSelected({ data, selected }: DocFile) {
  return { data, selected: !selected };
}
