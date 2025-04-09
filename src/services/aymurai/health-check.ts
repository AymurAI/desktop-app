import axios from 'axios';
import { AYMURAI_API_URL } from 'utils/config';

/**
 * Sends a file to the backend to be analyzed and retrieve a list of paragraphs
 * @param serverUrl url on which the backend is running (may be localhost of an internal server)
 * @returns a http status
 */
export async function getHealthCheck(
  serverUrl: string
): Promise<number | string> {
  try {
    const response = await axios
      .create({
        baseURL: !!serverUrl ? serverUrl : AYMURAI_API_URL,
      })
      .get('/server/healthcheck');
    return response.status;
  } catch (e) {
    const { message } = e as Error;
    console.error('Could not connect to server: ', message);
    return message;
  }
}
