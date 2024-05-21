import { DocumentParagraph, ExportDocumentSuccess } from 'types/aymurai';
import { fetcher } from './utils';

/**
 * Sends a file to the backend to be analyzed and retrieve a list of paragraphs
 * @param file File to be analyzed
 * @returns A list of paragraphs with their metadata
 */
export async function getParagraphs(file: File): Promise<DocumentParagraph[]> {
  const formData = new FormData();
  formData.append('file', file);

  // TODO: replace the code below with the comments once the AI's been updated
  // const response = await fetcher.post<DocumentParagraph[]>(
  //   '/document-extract',
  //   formData,
  //   {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   }
  // );
  // return response.data;

  const response = await fetcher.post<ExportDocumentSuccess>(
    '/document-extract',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.document
    .split('\n')
    .map((line) => ({ plain_text: line } as DocumentParagraph));
}
