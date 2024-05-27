import { fetcher } from './utils';

/**
 * @deprecated Should use the `/anonymizer/anonymize-document` endpoint instead as it transforms the document to ODT format and also anonymizes it.
 */
export default async function convertDocxToOdt(file: File) {
  // Add file to `FormData`
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetcher.post('/docx-to-odt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/octet-stream',
    },
    responseType: 'arraybuffer',
  });

  return res;
}
