import { GoogleToken } from 'types/google';

import { SpreadsheetId } from 'types/spreadsheet';
import { getSpreadsheet } from './spreadsheet';
import { getUser } from './user';

export default function google(token: GoogleToken) {
  return {
    spreadsheet: (id: SpreadsheetId) => ({
      data: () => getSpreadsheet(token, id),
    }),
    user: () => getUser(token),
  };
}
