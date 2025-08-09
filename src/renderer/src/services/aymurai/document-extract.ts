import type { Paragraph } from "@/types/file";
import { getParagraphId } from "@/utils/file/getParagraphId";

import api from "../api";

interface ParagraphsResponse {
  document: string[];
  header: null;
  footer: null;
  document_id: string;
}

/**
 * Sends a file to the backend to be analyzed and retrieve a list of paragraphs
 * @param file File to be analyzed
 * @param serverUrl String with the URL of the AyMurAI api
 * @returns A list of paragraphs with their metadata
 * @deprecated Replaced by React Query implementation
 */
export async function getParagraphs(file: File): Promise<Paragraph[]> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await api.post<ParagraphsResponse>(
      "/document-extract",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.document.map((p, i) => ({
      value: p,
      document_id: response.data.document_id,
      id: getParagraphId(p, i),
    }));
  } catch (e) {
    const { message } = e as Error;
    console.error("Could not connect to server: ", message);
    return [];
  }
}
