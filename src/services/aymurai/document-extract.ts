import { DocumentParagraph, ExportDocumentSuccess } from 'types/aymurai';
import { getExtension } from 'utils/file';
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

// TODO: remove. replaced by the above method
/**
 * Parses a `application/msword` file into plain HTML
 * @param file File to be converted to HTML
 * @returns A `string` representing the contents of the file into a HTML format
 * @deprecated
 */
export default async function parseDoc(file: File) {
  if (getExtension(file) === 'doc') {
    // Add file to `FormData`
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetcher.post<ExportDocumentSuccess>(
      '/document-extract',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Now we format the document, applying paragraphs to make it look better on the front
    const { document } = response.data;
    const lines = document.split('\n');
    const paragraphs = lines.map((line) => `<p>${line}</p>`);
    const html = paragraphs.join('');

    return html;
  } else {
    return '';
  }
}
