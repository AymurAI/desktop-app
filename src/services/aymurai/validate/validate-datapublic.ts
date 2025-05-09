import axios, { CanceledError } from "axios";
import { PredictLabel } from "types/aymurai";
import { AYMURAI_API_URL } from "utils/config";

/**
 * Retrieves saved validation data for a specific document
 * @param documentId ID of the document to validate
 * @param controller `AbortController` to handle request cancellation
 * @param serverUrl String with the URL of the AyMurAI api
 * @returns A list of `PredictLabel` or null if no validation exists
 */
export async function getDocumentValidation(
  documentId: string,
  controller: AbortController,
  serverUrl: string
): Promise<PredictLabel[] | null> {
  try {
    const response = await axios
      .create({
        baseURL: !!serverUrl ? serverUrl : AYMURAI_API_URL,
      })
      .get<PredictLabel[] | null>(
        `/datapublic/validation/document/${documentId}`,
        {
          signal: controller.signal,
        }
      );

    console.log({ response });
    if (response.data) {
      console.log("📄 Retrieved document validation: ", response.data);
      return response.data;
    }
    return null;
  } catch (e) {
    if (e instanceof CanceledError) {
      return null;
    } else {
      console.error(e);
      const { message } = e as Error;
      throw new Error(message);
    }
  }
}

/**
 * Saves validation data for a specific document
 * @param documentId ID of the document to validate
 * @param labels List of `PredictLabel` to save
 * @param controller `AbortController` to handle request cancellation
 * @param serverUrl String with the URL of the AyMurAI api
 * @returns The saved `PredictLabel[]` or null if the operation fails
 */
export async function saveDocumentValidation(
  documentId: string,
  labels: PredictLabel[],
  controller: AbortController,
  serverUrl: string
): Promise<PredictLabel[] | null> {
  try {
    const response = await axios
      .create({
        baseURL: !!serverUrl ? serverUrl : AYMURAI_API_URL,
      })
      .post<PredictLabel[] | null>(
        `/datapublic/validation/document/${documentId}`,
        labels,
        {
          signal: controller.signal,
        }
      );

    console.log({ response });
    if (response.data) {
      console.log("💾 Saved document validation: ", response.data);
      return response.data;
    }
    return null;
  } catch (e) {
    if (e instanceof CanceledError) {
      return null;
    } else {
      console.error(e);
      const { message } = e as Error;
      throw new Error(message);
    }
  }
}
