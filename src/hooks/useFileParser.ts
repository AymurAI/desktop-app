import { useEffect } from "react";
import { addParagraphs } from "reducers/file/actions";

import { getParagraphs } from "services/aymurai";
import type { DocFile } from "types/file";

import { useFileDispatch } from "./useFiles";

/**
 * Fetches the paragraphs of a file and adds them to the state. Also, returns the paragraphs
 * @param file File to be analyzed
 * @returns List of paragraphs with their metadata
 */
export function useFileParser(file: DocFile, serverUrl: string) {
  const dispatch = useFileDispatch();

  useEffect(() => {
    let loaded = false;
    const fetchParagraphs = async () => {
      // Prevents the function from running multiple times or if the paragraphs've already been loaded
      if (!loaded && !file.paragraphs) {
        const response = await getParagraphs(file.data, serverUrl);
        dispatch(addParagraphs(response, file.data.name));
      }
    };

    fetchParagraphs();

    return () => {
      loaded = true;
    };
  }, [file]);

  return file.paragraphs;
}
