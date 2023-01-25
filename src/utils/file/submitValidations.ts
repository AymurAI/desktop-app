import google from 'services/google';
import { DocFile } from 'types/file';
import { GoogleToken } from 'types/google';
import { DATASET_URL } from 'utils/config';
import { spreadsheetURLToId, validationToArray } from 'utils/google';

interface Props {
  online: boolean | undefined;
  token: GoogleToken | null;
  validations: DocFile['validationObject'];
}
/**
 * Submits the data through the appropiate way. Saves into the filesystem when
 * `online=false` and to the cloud when `online=true`
 * @param online Has the user authenticated through Google OAuth?
 * @param token Auth token, used to interact with Google Spreadsheet API
 * @param validations All the validated data for a single file
 */
export default async function submitValidations({
  online,
  token,
  validations,
}: Props) {
  if (online) {
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
      .append(validationToArray(validations));
  } else {
    // Write a file with the validated data
    // TODO realizar una implementación de `exceljs` para poder guardar en local
    console.log('Locally saved your data');
  }
}
