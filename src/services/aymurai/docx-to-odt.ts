import { fetcher } from "./utils";

export default async function convertDocxToOdt(file: File) {
  // Add file to `FormData`
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetcher.post("/docx-to-odt", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/octet-stream",
    },
    responseType: "arraybuffer",
  });

  return res;
}
