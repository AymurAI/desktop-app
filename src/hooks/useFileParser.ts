import { useCallback, useEffect, useState } from "react";

import { parseDoc } from "services/aymurai";
import convertDocxToHTML from "services/aymurai/convert-docx-to-html";
import { convertToHTML, getExtension } from "utils/file";

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
  const [header, setHeader] = useState<string | undefined>("");

  const updateHTML = useCallback(
    (html: string) => {
      const result = onPostProcess?.(html) ?? html;
      setHtml(result);
    },
    [onPostProcess]
  );

  const extension = getExtension(file);

  // Check if the file object has any parsed HTML attached to it
  if (!html && extension === "docx") {
    convertToHTML(file, updateHTML);
    convertDocxToHTML(file).then((res) => {
      setHeader(res.data.header?.join("").toString());
    });
  }

  useEffect(() => {
    // Check if the file object has any parsed HTML attached to it
    if (!html && extension === "doc") parseDoc(file).then(updateHTML);
  }, [file, extension, html, updateHTML]);

  return { document: html ?? "", header: header ?? "" };
}
