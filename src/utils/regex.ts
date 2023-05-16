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
 * Matches all the text that contains the word
 */
const includes = (word: string) => new RegExp(replaceVowels(word), 'gi');

/**
 * Matches all the WORDS that matches the given word
 */
const whole = (word: string) =>
  new RegExp(`\\b${replaceVowels(word)}\\w*`, 'gi');

const regex = {
  includes,
  whole,
};

export default regex;
