import { convertToHtml as bufferToHtml } from 'mammoth/mammoth.browser';

type ReaderCallback = (result: ArrayBuffer) => Promise<void>;
/**
 * Reads a file converted to an `ArrayBuffer`
 * @param file File to be converted to `ArrayBuffer`
 * @param callback Function to be called after the file has benn converted to an `ArrayBuffer`
 */
function readFile(file: File, callback: ReaderCallback) {
  const reader = new FileReader();

  reader.onload = (event) => {
    let result = event.target?.result;
    let arrayBuffer: ArrayBuffer;

    // Check if we have an ArrayBuffer, if not, use an empty Array
    if (result && result instanceof window.ArrayBuffer) arrayBuffer = result;
    else arrayBuffer = new window.ArrayBuffer(0);

    callback(arrayBuffer);
  };

  reader.readAsArrayBuffer(file);
}

type ConvertCallback = (html: string) => void;
/**
 * Parses a docx file into HTML
 * @param file File to be parsed to HTML
 * @param callback Function to call once the file has benn parsed to HTML
 */
export default function convertToHTML(file: File, callback: ConvertCallback) {
  readFile(file, async (arrayBuffer) => {
    const { value } = await bufferToHtml({ arrayBuffer });

    callback(value);
  });
}
