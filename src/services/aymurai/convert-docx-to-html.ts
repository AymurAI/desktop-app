import { ExportDocumentSuccess } from "types/aymurai";
import { fetcher } from "./utils";

export default async function convertDocxToHTML(file: File) {
  // Add file to `FormData`
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetcher.post<ExportDocumentSuccess>(
    "/document-extract/docx2html",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res;
}
