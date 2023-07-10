import regex from 'utils/regex';

export const getFirstPrediction = (
  isSearching: boolean,
  word: string,
  html: string
) => {
  if (!isSearching) return null;

  const match = regex.htmlTag(word, 'mark').exec(html);

  if (match) return `${match[1]}${match[2]}`;
  else return null;
};
