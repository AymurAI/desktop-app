import { convertToHtml } from 'mammoth/mammoth.browser';

type ArrayBufferCallback = (arrayBuffer: string | ArrayBuffer) => Promise<void>;
/**
 * Reads a file converted to an `ArrayBuffer`
 * @param file File to be converted to `ArrayBuffer`
 * @param callback Function to be called after the file has benn converted to an `ArrayBuffer`
 */
function readAsArrayBuffer(file: File, callback: ArrayBufferCallback) {
  const reader = new FileReader();

  reader.onload = (event) => {
    // Converts the file into an ArrayBuffer. Default to an empty array
    const arrayBuffer = event.target?.result ?? new window.ArrayBuffer(0);

    // Calls the callback with the ArrayBuffer as argument
    callback(arrayBuffer);
  };

  // Reads the file
  reader.readAsArrayBuffer(file);
}

/**
 * Parses a docx file into HTML and inserts it into an `HTMLDivElement` container
 * @param file File to be parsed to HTML
 * @param container Container of the parsed docx file
 */
export default function insertIntoHTML(file: File, container: HTMLDivElement) {
  readAsArrayBuffer(file, async (arrayBuffer) => {
    // @ts-ignore
    convertToHtml({ arrayBuffer }).then((result) => {
      container.innerHTML = result.value;
    });
  });
}
