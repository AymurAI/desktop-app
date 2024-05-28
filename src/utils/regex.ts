/**
 * Given a vowel, returns a 'regex' that matches the vowel with or without accent
 */
const getVowel = (vowel: string) => {
  switch (vowel) {
    case 'a':
    case 'á':
      return '[aá]';
    case 'e':
    case 'é':
      return '[eé]';
    case 'i':
    case 'í':
      return '[ií]';
    case 'o':
    case 'ó':
      return '[oó]';
    case 'u':
    case 'ú':
    case 'ü':
      return '[uúü]';
    default:
      return vowel;
  }
};

/**
 * Replaces all the vowels with or without accent with a regex that matches the two options
 */
const replaceVowels = (char: string) => {
  let parsed = '';

  for (const vowel of char) {
    parsed = `${parsed}${getVowel(vowel)}`;
  }

  return parsed;
};

/**
 * Replaces all the special characters with a backslash so they can be used in a regex.
 */
const replaceEscaped = (word: string) => {
  const escapedChars = [
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    '.',
    '*',
    '+',
    '?',
    '$',
    '\\',
    '|',
  ];
  let parsed = word;

  for (const char of escapedChars) {
    parsed = parsed.replaceAll(char, `\\${char}`);
  }

  return parsed;
};

/**
 * Using the two replace functions, returns a sanitized word that can be used in a regex
 */
const sanitize = (word: string) => replaceVowels(replaceEscaped(word));

/**
 * Matches all the text that contains the word
 */
export const includes = (word: string) => new RegExp(sanitize(word), 'gi');
