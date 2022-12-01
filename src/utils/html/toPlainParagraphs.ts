/**
 * Splits the given HTML into paragraphs to be used on AI prediction
 * @param html HTML to be analyzed
 * @returns An array of paragraphs with their inner HTML tags removed
 */
export default function toPlainParagraphs(html: string) {
  const htmlRegex = /<[^>]*>/g;

  // Splits the whole html into <p></p>
  const paragraphs = html.split('</p>');

  // Remove any html tag
  const result = paragraphs.map((p) => p.replaceAll(htmlRegex, ''));

  return result;
}
