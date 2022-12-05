/**
 * Mark the predicted words with a `<mark>` tag to highlight them
 * @param html HTML content to be analyzed
 * @param words Words to be matched inside the HTML
 * @returns The same HTML but with the given words enclosed in `<mark>` tags
 */
export default function markPredictedWords(html: string, words: string[]) {
  let replaced = html;

  // Enclose predicted words with <mark> tag
  words.forEach((word) => {
    replaced = replaced.replace(word, `<mark>${word}</mark>`);
  });

  return replaced;
}
