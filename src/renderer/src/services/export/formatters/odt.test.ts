import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { ExportDocument } from "../types";
import {
  WATERMARK_LINK_COLOR,
  WATERMARK_LINK_TEXT,
  WATERMARK_PREFIX_TEXT,
  WATERMARK_TEXT_COLOR,
  WATERMARK_URL,
} from "../watermark";
import { renderOdt } from "./odt";

// jsdom's Blob has no arrayBuffer()/text(), unlike a real browser's — go
// through FileReader instead, which jsdom does implement.
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

async function readZipEntry(blob: Blob, path: string): Promise<string> {
  const buffer = await blobToArrayBuffer(blob);
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file(path);
  if (!file) throw new Error(`${path} missing from generated .odt`);
  return file.async("string");
}

const readContentXml = (blob: Blob) => readZipEntry(blob, "content.xml");
const readStylesXml = (blob: Blob) => readZipEntry(blob, "styles.xml");

describe("renderOdt", () => {
  it("produces a zip with the required ODF entries", async () => {
    const doc: ExportDocument = { blocks: [{ text: "Hola" }] };
    const blob = await renderOdt(doc);
    const buffer = await blobToArrayBuffer(blob);
    const zip = await JSZip.loadAsync(buffer);

    expect(zip.file("mimetype")).toBeTruthy();
    expect(zip.file("META-INF/manifest.xml")).toBeTruthy();
    expect(zip.file("content.xml")).toBeTruthy();
    expect(zip.file("styles.xml")).toBeTruthy();
  });

  it("renders the title and bolds the speaker/timestamp prefix", async () => {
    const doc: ExportDocument = {
      title: "Audiencia",
      blocks: [{ speaker: "Persona 1", timestamp: "00:05", text: "Hola" }],
    };
    const xml = await readContentXml(await renderOdt(doc));

    expect(xml).toContain('<text:p text:style-name="Title">Audiencia</text:p>');
    expect(xml).toContain(
      '<text:span text:style-name="Bold">[00:05] Persona 1: </text:span>Hola',
    );
  });

  it("renders a plain paragraph with no bold span when speaker/timestamp are absent", async () => {
    const xml = await readContentXml(
      await renderOdt({ blocks: [{ text: "Hola" }] }),
    );
    expect(xml).toContain("<text:p>Hola</text:p>");
    expect(xml).not.toContain('text:style-name="Bold"');
  });

  it("escapes XML-sensitive characters in text and speaker names", async () => {
    const xml = await readContentXml(
      await renderOdt({
        blocks: [{ speaker: "A & B", text: "<script>alert(1)</script>" }],
      }),
    );
    expect(xml).toContain("A &amp; B");
    expect(xml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(xml).not.toContain("<script>");
  });

  it("separates the title and every block with a blank paragraph, like the txt export", async () => {
    const doc: ExportDocument = {
      title: "Audiencia",
      blocks: [{ text: "Hola" }, { text: "Chau" }],
    };
    const xml = await readContentXml(await renderOdt(doc));

    expect(xml).toContain(
      '<text:p text:style-name="Title">Audiencia</text:p><text:p/><text:p>Hola</text:p><text:p/><text:p>Chau</text:p>',
    );
  });

  it("adds a page footer watermark matching the anonymizer's visual style", async () => {
    const xml = await readStylesXml(
      await renderOdt({ blocks: [{ text: "Hola" }] }),
    );

    expect(xml).toContain(WATERMARK_PREFIX_TEXT);
    expect(xml).toContain(`>${WATERMARK_LINK_TEXT}<`);
    expect(xml).toContain(`xlink:href="${WATERMARK_URL}"`);
    expect(xml).toContain(`fo:color="${WATERMARK_TEXT_COLOR}"`);
    expect(xml).toContain(`fo:color="${WATERMARK_LINK_COLOR}"`);
    expect(xml).toContain("<style:footer>");
  });

  it("underlines the AymurAI link with an explicit color (not the 'font-color' keyword some converters ignore)", async () => {
    const xml = await readStylesXml(
      await renderOdt({ blocks: [{ text: "Hola" }] }),
    );
    expect(xml).toContain('style:text-underline-style="solid"');
    expect(xml).toContain(
      `style:text-underline-color="${WATERMARK_LINK_COLOR}"`,
    );
    // Also nested as a span inside the <text:a>, since some ODF consumers
    // only honor character formatting applied at the span level within a
    // hyperlink rather than on the <text:a> element's own text:style-name.
    expect(xml).toContain(
      `<text:a xlink:href="${WATERMARK_URL}" text:style-name="FooterWatermarkLink"><text:span text:style-name="FooterWatermarkLink">${WATERMARK_LINK_TEXT}</text:span></text:a>`,
    );
  });

  it("positions the footer close to the page's bottom edge", async () => {
    const xml = await readStylesXml(
      await renderOdt({ blocks: [{ text: "Hola" }] }),
    );
    expect(xml).toContain('fo:margin-bottom="1.1cm"');
    expect(xml).toContain('fo:margin-bottom="0cm"');
  });

  it("defines an explicit page size and does not force a page break on every paragraph", async () => {
    // Regression check: `style:master-page-name` on the *paragraph* style
    // used by every block (rather than only on a page-layout) makes ODF
    // readers start a new page on every single paragraph. Confirmed via a
    // real LibreOffice conversion while building this — a 3-block doc
    // rendered as one paragraph per page until this was fixed.
    const xml = await readStylesXml(
      await renderOdt({ blocks: [{ text: "Hola" }] }),
    );
    expect(xml).not.toContain(
      '<style:style style:name="Standard" style:family="paragraph" style:master-page-name',
    );
    expect(xml).toContain('fo:page-width="21.001cm"');
    expect(xml).toContain('fo:page-height="29.7cm"');
  });

  it("declares and uses the Archivo font for body text, title and the watermark", async () => {
    const doc: ExportDocument = {
      title: "Audiencia",
      blocks: [{ speaker: "Persona 1", timestamp: "00:05", text: "Hola" }],
    };
    const blob = await renderOdt(doc);
    const [contentXml, stylesXml] = await Promise.all([
      readContentXml(blob),
      readStylesXml(blob),
    ]);

    for (const xml of [contentXml, stylesXml]) {
      expect(xml).toContain(
        '<style:font-face style:name="Archivo" svg:font-family="Archivo"/>',
      );
      expect(xml).toContain('style:font-name="Archivo"');
    }
  });
});
