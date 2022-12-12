import { DocFile } from 'types/file';

/**
 * Finds the next available index and returns it
 * @param cur Current `selected` index
 * @param state State array of files
 * @returns The next available index
 */
export function movePrevious(cur: number, state: DocFile[]) {
  let newIndex = cur - 1;

  while (state[newIndex].validated) {
    newIndex--;

    if (newIndex === 0) break;
  }

  return newIndex;
}

/**
 * Finds the previous available index and returns it
 * @param cur Current `selected` index
 * @param state State array of files
 * @returns The previous available index
 */
export function moveNext(cur: number, state: DocFile[]) {
  let newIndex = cur + 1;

  while (state[newIndex].validated) {
    newIndex++;

    if (newIndex === state.length) break;
  }

  return newIndex;
}
