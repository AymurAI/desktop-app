import { Workflows } from 'types/aymurai';
import { fetcher } from './utils';

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
export async function getParagraphs(file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetcher.post<ParagraphsResponse>(
    '/document-extract',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return response.data.document;
}
