import { GoogleToken } from 'types/google';

import { SpreadsheetId, WriteValue } from 'types/spreadsheet';
import {
  append,
  getRange,
  getSpreadsheetMetadata,
  writeRange,
} from './spreadsheet';
import { getUser } from './user';

export default function google(token: GoogleToken) {
  return {
    spreadsheet: (id: SpreadsheetId) => ({
      metadata: () => getSpreadsheetMetadata(token, id),
      range: (start: string, end: string) => getRange(token, id, start, end),
      append: (values: WriteValue[][]) => append(token, id, values),
      write: (values: WriteValue[][], start: string, end: string) =>
        writeRange(token, id, values, start, end),
    }),
    user: () => getUser(token),
  };
}
