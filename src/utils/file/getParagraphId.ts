import RegexEscape from 'regex-escape';
/**
 * Hashes a word using _base64_ encoding.
 * @param word The word to be hashed.
 * @returns A `string` representing the hashed word.
 */
const hash = (word: string) => {
  try {
    return window.btoa(RegexEscape(word));
  } catch (e) {
    console.error('Error parsing word:', word);
    console.error(e);
    return 'err';
  }
};

/**
 * Generates a string ready to be used as an ID by splitting and hashing the paragraph.
 * @param paragraph Paragraph to be hashed.
 * @returns A `string` representing the hashed paragraph.
 */
export const getParagraphId = (paragraph: string) => {
  const start = paragraph.slice(0, 15);
  const end = paragraph.slice(-15);
  return hash(start + end).slice(0, 30);
};
