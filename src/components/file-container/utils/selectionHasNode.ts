/**
 * Check if the selection contains another Node.
 * @param selection The current selection.
 * @returns `true` if the selection contains a Node, `false` otherwise.
 */
export const selectionHasNode = (selection: Selection | null): boolean => {
  if (!selection) return false;

  const container = document.createElement('div');

  for (let i = 0; i < selection.rangeCount; ++i) {
    container.appendChild(selection.getRangeAt(i).cloneContents());
  }

  return new RegExp(/<.*?>/g).test(container.innerHTML);
};
