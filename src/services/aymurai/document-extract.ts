import { ExportDocumentSuccess } from 'types/aymurai';
import { getExtension } from 'utils/file';
import { fetcher } from './utils';

/**
 * Parses a `application/msword` file into plain HTML
 * @param file File to be converted to HTML
 * @returns A `string` representing the contents of the file into a HTML format
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
