import { useEffect, useState } from 'react';
import { convertToHTML } from 'utils/file';

type PostProcessCallback = (html: string) => string;
/**
 * Converts a file to HTML `string`
 * @param file Parses a `.docx` file into HMTL
 * @param onPostProcess Function to be applied after the parsing process was completed
 * @returns The parsed HTML in `string` format
 */
export default function useFileParser(
  file: File,
  onPostProcess?: PostProcessCallback
) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    convertToHTML(file, (html) => {
      const result = onPostProcess?.(html) ?? html;
      setHtml(result);
    });
  }, [file, onPostProcess]);

  return html;
}
