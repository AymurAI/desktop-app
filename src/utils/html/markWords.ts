import regex from "utils/regex";

/**
 * Removes duplicated words from the predictions array
 * @param words Words array, containing all the predictions
 * @returns A reduced words array, with duplicated entries removed
 */
function removeDuplicated(words: string[]) {
  return words.reduce<string[]>((prev, cur) => {
    const isDuplicated = prev.find((t) => t.includes(cur));

    if (isDuplicated) return prev;
    else return [...prev, cur];
  }, []);
}

/**
 * Mark the predicted words with a `<mark>` tag to highlight them
 * @param html HTML content to be analyzed
 * @param words Words to be matched inside the HTML
 * @returns The same HTML but with the given words enclosed in `<mark>` tags
 */
function predicted(html: string, words: string[]) {
  let replaced = html;

  const filteredWords = removeDuplicated(words);

  // Enclose predicted words with <mark> tag
  filteredWords.forEach((word) => {
    replaced = replaced.replaceAll(
      word,
      `<mark class="predicted-word">${word}</mark>`
    );
  });

  return replaced;
}

function anonymizer(
  html: string,
  words: string[],
  tags: any[],
  anonymize: boolean = false,
  header?: string
) {
  let headerImg = "";
  let headerBody = "";

  if (header) {
    const splitHeader = header
      ?.split("<p>")
      .map((text) => text.replaceAll("</p>", ""));
    headerImg = splitHeader?.find((text) => text.includes("img")) ?? "";
    if (headerImg) {
      headerImg = `<p>${headerImg}</p>`;
    }

    headerBody = splitHeader
      .map((text) => {
        if (!text.includes("img") && text !== "") return `<p>${text}</p>`;

        return "";
      })
      .join("");
  }
  let replaced = headerBody + html;

  const filteredWords = removeDuplicated(words);

  filteredWords.forEach((word) => {
    if (word !== ":" && word !== "=")
      replaced = replaced.replaceAll(
        word,

        anonymize
          ? `<strong>&lt;${getTag(tags, word)}&gt;</strong>`
          : `<mark class="predicted-word"> ${word} <strong>${getTag(
              tags,
              word
            )}</strong> <close id="${word}">X</close></mark>`
      );
  });

  return headerImg + replaced;
}

function getTag(tags: any, word: string) {
  const tag = tags.find((data: any) => data.text === word);

  return tag?.tag;
}

function searched(html: string | null, word: string) {
  if (!html) return "";
  if (word.length <= 2) return html;

  const regExp = regex.includes(word);
  //
  return html.replaceAll(regExp, `<mark class="searched-word">$&</mark>`);
}

const mark = {
  predicted,
  anonymizer,
  searched,
};

export default mark;
