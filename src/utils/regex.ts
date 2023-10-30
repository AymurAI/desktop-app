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

/**
 * Matches the given word inside the given HTML tag, including the word next to the tag
 * @param word Word to match
 * @param tag  HTML tag to match
 * @returns A regex that matches the given word inside the given tag and the word next to it
 */
const htmlTag = (word: string, tag: string) => {
  const replaced = replaceVowels(word);

  return new RegExp(`<${tag}\\s*.*?>(${replaced})</${tag}>([A-zÀ-ú]*)`, 'i');
};

const regex = {
  includes,
  whole,
  htmlTag,
};

export default regex;
