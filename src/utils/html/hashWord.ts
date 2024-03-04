/**
 * Hashes a word using _base64_ encoding.
 * @param word The word to be hashed.
 * @returns A `string` representing the hashed word.
 */
export const hash = (word: string) => {
  // FIXME: improve sanitization
  const sanitized = word.replaceAll(/“|”/g, '"').replaceAll(/‘|’/g, "'");

  try {
    return window.btoa(sanitized);
  } catch {
    console.error('Error parsing word:', word);
    return 'err';
  }
};

/**
 * Reverses a hashed word, obtaining the original word.
 * @param hash The _base64_ hashed word to be reversed.
 * @returns A `string` representing the original word.
 */
export const reverse = (hash: string) => {
  return window.atob(hash);
};
