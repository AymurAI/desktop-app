import axios from 'axios';

import { GoogleToken } from 'types/google';
import {
  SpreadsheetId,
  SpreadsheetAppend,
  SpreadsheetMetadata,
  SpreadsheetRange,
  WriteValue,
} from 'types/spreadsheet';

import { auth } from './utils';

/**
 * Local fetcher to use on Spreadsheet resources
 */
const fetcher = axios.create({
  baseURL: 'https://sheets.googleapis.com/v4/spreadsheets/',
});

async function getSheetTitle(
  token: GoogleToken,
  id: SpreadsheetId,
  sheetNumber: number = 0
) {
  const data = await getSpreadsheetMetadata(token, id);

  return data.sheets[sheetNumber].properties.title;
}

/**
 * Fetches a single spreadsheet and its metadata. Refer to [Google API](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get).
 * @param token Authorization token from OAuth2
 * @param id Id of the spreadsheet
 * @returns All the metadata referring to the spreadsheet with the given id
 */
export async function getSpreadsheetMetadata(
  token: GoogleToken,
  id: SpreadsheetId
) {
  const { data } = await fetcher.get<SpreadsheetMetadata>(id, {
    headers: auth(token),
  });
  return data;
}

/**
 *
 * @param token Authorization token from OAuth2
 * @param id Id of the spreadsheet
 * @param start Start of the range
 * @param end End of the range
 */
export async function getRange(
  token: GoogleToken,
  id: SpreadsheetId,
  start: string = 'A1',
  end: string = 'A1'
): Promise<SpreadsheetRange> {
  const sheetTitle = await getSheetTitle(token, id);
  const range = `${sheetTitle}!${start}:${end}`;

  const { data } = await fetcher.get<SpreadsheetRange>(
    `${id}/values/${range}`,
    {
      headers: auth(token),
    }
  );

  return data;
}

export async function writeRange(
  token: GoogleToken,
  id: SpreadsheetId,
  values: WriteValue[][],
  start: string,
  end: string
) {
  const sheetTitle = await getSheetTitle(token, id);
  const range = `${sheetTitle}!${start}:${end}`;

  const { data } = await fetcher.put(
    `${id}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      range,
      majorDimension: 'ROWS',
      values,
    },
    {
      headers: auth(token),
    }
  );

  return data;
}

/**
 * Appends a set of data to the spreadsheet
 * @param token Google token
 * @param id Id of the spreadsheet
 * @param data Data to be appended to the spreadsheet. At least one element
 * @returns Success response from the service
 */
export async function append(
  token: GoogleToken,
  id: SpreadsheetId,
  data: WriteValue[]
) {
  // const rows = data.length + 1; // + 1 because sheets are 1-based

  // Always work on the first sheet
  const sheetTitle = await getSheetTitle(token, id);

  const range = `${sheetTitle}!A1:BM1`; // BM is the total width of the spreadsheet

  const response = await fetcher.post<SpreadsheetAppend>(
    `${id}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      range,
      majorDimension: 'ROWS',
      values: [[null, null, ...data]],
    },
    {
      headers: auth(token),
    }
  );

  // This has the form of 'xxxxxxxx!AY:BY', we want the 'AY:BY" part
  const affectedRange = response.data.updates.updatedRange.split('!')[1];
  // Get the number from the range
  const row = affectedRange.match(/\d+/)![0]; // We make the assumption we capture a number
  const rowNumber = parseInt(row);

  const indexes = await getRange(
    token,
    id,
    `A${rowNumber - 1}`,
    `B${rowNumber - 1}`
  );

  // Check if we have values before
  if (indexes.values) {
    // Get the indexes as a number
    const parsedIndexes = indexes.values[0].map((index) => parseInt(index));
    // Set a default value in case of NaN
    const [mainIndex, offset] = parsedIndexes.map((i) => (isNaN(i) ? 0 : i));

    // Sets the 'N' and the 'NRO_REGISTRO' column
    await writeRange(
      token,
      id,
      [[`${mainIndex + 1}`, `${offset + 1}`]],
      `A${rowNumber}`,
      `B${rowNumber}`
    );
  } else {
    // If we have'nt any values set 0 as default
    await writeRange(token, id, [['0', '0']], `A${rowNumber}`, `B${rowNumber}`);
  }

  return response.data;
}
