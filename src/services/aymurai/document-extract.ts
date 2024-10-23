import { Paragraph } from "types/file";
import { getParagraphId } from "utils/file/getParagraphId";
import { fetcher } from "./utils";

interface ParagraphsResponse {
  document: string[];
  header: null;
  footer: null;
}

/**
 * Sends a file to the backend to be analyzed and retrieve a list of paragraphs
 * @param file File to be analyzed
 * @returns A list of paragraphs with their metadata
 */
export async function getParagraphs(file: File): Promise<Paragraph[]> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetcher.post<ParagraphsResponse>(
      "/document-extract",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.document.map((p, i) => ({
      value: p,
      id: getParagraphId(p, i),
    }));
  } catch (e) {
    const { message } = e as Error;
    console.error("Could not connect to server: ", message);
    return [];
  }
}
