import { DocumentParagraph, Workflows } from 'types/aymurai';
import { fetcher } from './utils';

interface ParagraphsWithMetadataResponse {
  paragraphs: DocumentParagraph[];
}
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
export async function getParagraphs(
  file: File,
  workflow: Workflows = 'datapublic'
): Promise<DocumentParagraph[]> {
  const formData = new FormData();
  formData.append('file', file);
  const config = { headers: { 'Content-Type': 'multipart/form-data' } };

  if (workflow === 'datapublic') {
    const response = await fetcher.post<ParagraphsResponse>(
      '/document-extract',
      formData,
      config
    );

    return response.data.document.map(
      (p) => ({ plain_text: p } as DocumentParagraph)
    );
  } else {
    const response = await fetcher.post<ParagraphsWithMetadataResponse>(
      '/document-extract/docx2xml',
      formData,
      config
    );

    return response.data.paragraphs;
  }
}
