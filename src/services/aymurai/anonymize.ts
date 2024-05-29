// import { PredictLabel } from 'types/aymurai';
import { DocFile } from 'types/file';
// import { getParagraphId as id } from 'utils/file/getParagraphId';

import { fetcher } from './utils';

// type Body = {
//   // The paragraph
//   document: string;
//   labels: PredictLabel[];
// }[];

// const body = (file: DocFile): Body => {
//   const paragraphs = file.paragraphs ?? [];
//   const labels = file.predictions ?? [];

//   return paragraphs.map((p) => ({
//     document: p,
//     labels: labels.filter((l) => l.paragraphId === id(p)),
//   }));
// };

/**
 * Anonymize a document
 * @param file File to be processed
 * @param body Body containing the plain text and the annotations
 * @returns The anonymized document in a `Blob`
 */
export const anonymize = async (file: DocFile) => {
  // Add file to `FormData`
  const formData = new FormData();
  formData.append('file', file.data);
  // TODO: add annotations whenever the backend implements it
  // formData.append('annotations', JSON.stringify(body(file)));

  const response = await fetcher.post<ArrayBuffer>(
    '/anonymizer/anonymize-document',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/octet-stream',
      },
      responseType: 'arraybuffer',
    }
  );

  return new Blob([response.data]);
};
