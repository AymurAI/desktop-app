import { FormValue } from 'hooks/useForm';
import google from 'services/google';
import { GoogleToken } from 'types/google';
import { DATASET_URL } from 'utils/config';
import { spreadsheetURLToId } from 'utils/google';

interface Props {
  token: GoogleToken | null;
  validations: FormValue[][];
}
/**
 * POST the data to the Google Spreadsheet API
 * @param token Google OAuth token used to interact with the API
 * @param validations Validations to submit to the cloud
 */
export default async function online({ token, validations }: Props) {
  // POST the data to the spreadsheet API

  if (!token) {
    // TODO en vez de lanzar un error, averiguar si es posible abrir la pantalla de auth
    // de Google para conseguir el token
    throw new Error(
      'No token was found, cannot POST the data to the Google API!'
    );
  }

  await google(token)
    .spreadsheet(spreadsheetURLToId(DATASET_URL))
    .append(validations);
}
