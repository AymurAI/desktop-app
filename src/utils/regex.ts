const replaceVowel = (char: string) => {
  switch (char) {
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
      return char;
  }
}

function wordSearch(word: string) {
  let parsed = '';

  for (const char of word) {
    parsed = `${parsed}${replaceVowel(char)}`
  }

  return new RegExp(`\\b${parsed}\\w*`, 'gi');
}

const regex = {
  wordSearch,
}

export default regex;