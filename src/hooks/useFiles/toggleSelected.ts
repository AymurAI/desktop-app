import { DocFile } from 'types/file';

/**
 * Toggles the `selected` property of a `DocFile` object
 * @param `DocFile` to toggle
 * @returns A new object with its `selected` property toggled
 */
function toggle(file: DocFile) {
  return { ...file, selected: !file.selected };
}

export default function toggleSelected(fileName: string, state: DocFile[]) {
  const toggledArray = state.map((file) =>
    file.data.name === fileName ? toggle(file) : file
  );

  return toggledArray;
}
