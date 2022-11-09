import axios from 'axios';

import { GoogleToken } from 'types/google';
import { SpreadsheetId } from 'types/spreadsheet';

import { auth } from './utils';

/**
 * Local fetcher to use on Spreadsheet resources
 */
const fetcher = axios.create({
  baseURL: 'https://sheets.googleapis.com/v4/spreadsheets/',
});

/**
 * Fetches a single spreadsheet and its metadata. Refer to [Google API](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get).
 * @param token Authorization token from OAuth2
 * @param id Id of the spreadsheet
 * @returns All the metadata referring to the spreadsheet with the given id
 */
export async function getSpreadsheet(token: GoogleToken, id: SpreadsheetId) {
  const { data } = await fetcher.get(id, { headers: auth(token) });
  return data;
}
