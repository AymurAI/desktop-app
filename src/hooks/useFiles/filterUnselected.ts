import { DocFile } from 'types/file';

/**
 * Removes any file whose `selected` property is `false`
 * @param state Current files state
 * @returns A new array with the files filtered
 */
export default function filterUnselected(state: DocFile[]) {
  const filtered = state.filter(({ selected }) => selected);

  return filtered;
}
