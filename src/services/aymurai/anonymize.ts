import { PredictLabel } from 'types/aymurai';
import { fetcher } from './utils';

type Body = {
  document: string;
  labels: PredictLabel[];
  // TODO: wait for backend to define if the property is required
  // metadata: NonNullable<DocumentParagraph['metadata']>;
}[];

/**
 * Anonymize a document
 * @param file File to be processed
 * @param body Body containing the plain text and the annotations
 * @returns The anonymized document in a `Blob`
 */
export const anonymize = (file: File, body: Body) => {
  // Add file to `FormData`
  const formData = new FormData();
  formData.append('file', file);
  formData.append('annotations', JSON.stringify(body));

  return fetcher.post('/anonymizer/anonymize-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/octet-stream',
    },
    responseType: 'arraybuffer',
  });
};
