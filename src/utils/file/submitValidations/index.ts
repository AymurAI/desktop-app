import { DocFile } from 'types/file';
import { GoogleToken } from 'types/google';
import { validationToArray } from 'utils/google';
import offline from './offline';
import online from './online';

interface Props {
  isOnline: boolean | undefined;
  token: GoogleToken | null;
  validations: DocFile['validationObject'];
}
/**
 * Submits the data through the appropiate way. Saves into the filesystem when
 * `online=false` and to the cloud when `online=true`
 * @param isOnline Has the user authenticated through Google OAuth?
 * @param token Auth token, used to interact with Google Spreadsheet API
 * @param validations All the validated data for a single file
 */
export default async function submitValidations({
  isOnline,
  token,
  validations,
}: Props) {
  const validationArray = validationToArray(validations);

  if (isOnline) {
    await online({ token, validations: validationArray });
  } else {
    await offline(validationArray);
  }
}
