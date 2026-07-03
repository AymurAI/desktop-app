import JSZip from "jszip";
import type { ExportDocument } from "../types";
import {
  WATERMARK_FONT_SIZE_PT,
  WATERMARK_LINK_COLOR,
  WATERMARK_LINK_TEXT,
  WATERMARK_PREFIX_TEXT,
  WATERMARK_TEXT_COLOR,
  WATERMARK_URL,
} from "../watermark";
import { blockPrefix } from "./block-prefix";

const ODT_MIME_TYPE = "application/vnd.oasis.opendocument.text";

// Shared between content.xml and styles.xml's root elements — styles.xml
// additionally needs xlink (for the footer's hyperlink), content.xml doesn't.
const ODF_NAMESPACES =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" ' +
  'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"';
const XLINK_NAMESPACE = 'xmlns:xlink="http://www.w3.org/1999/xlink"';

// Matches the font used across AymurAI's other generated documents (see the
// backend's anonymization watermark scripts). Declared via font-face-decls
// and referenced by name only — if a reader/converter doesn't have Archivo
// installed, it silently falls back to a substitute rather than failing.
const DOCUMENT_FONT_NAME = "Archivo";
const FONT_FACE_DECLS = `<office:font-face-decls><style:font-face style:name="${DOCUMENT_FONT_NAME}" svg:font-family="${DOCUMENT_FONT_NAME}"/></office:font-face-decls>`;

const MANIFEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODT_MIME_TYPE}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

// Footer watermark lives in styles.xml's master-page (ODF's footers are
// page-master content, not part of the document body) — its visual style
// mirrors the anonymizer's own document watermark (see watermark.ts).
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles ${ODF_NAMESPACES} ${XLINK_NAMESPACE} office:version="1.2">
  ${FONT_FACE_DECLS}
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph">
      <style:text-properties style:font-name="${DOCUMENT_FONT_NAME}"/>
    </style:style>
    <style:style style:name="FooterWatermark" style:family="paragraph">
      <style:paragraph-properties fo:text-align="end"/>
    </style:style>
    <style:style style:name="FooterWatermarkText" style:family="text">
      <style:text-properties style:font-name="${DOCUMENT_FONT_NAME}" fo:font-size="${WATERMARK_FONT_SIZE_PT}pt" fo:color="${WATERMARK_TEXT_COLOR}"/>
    </style:style>
    <style:style style:name="FooterWatermarkLink" style:family="text">
      <style:text-properties style:font-name="${DOCUMENT_FONT_NAME}" fo:font-size="${WATERMARK_FONT_SIZE_PT}pt" fo:color="${WATERMARK_LINK_COLOR}" fo:font-weight="bold" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="${WATERMARK_LINK_COLOR}"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1">
      <style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" style:print-orientation="portrait" fo:margin-top="2cm" fo:margin-bottom="1.1cm" fo:margin-left="2cm" fo:margin-right="2cm"/>
      <style:footer-style><style:header-footer-properties fo:min-height="0.3in" fo:margin-top="0.15cm" fo:margin-bottom="0cm"/></style:footer-style>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="PM1">
      <style:footer>
        <text:p text:style-name="FooterWatermark"><text:span text:style-name="FooterWatermarkText">${WATERMARK_PREFIX_TEXT}</text:span><text:a xlink:href="${WATERMARK_URL}" text:style-name="FooterWatermarkLink"><text:span text:style-name="FooterWatermarkLink">${WATERMARK_LINK_TEXT}</text:span></text:a></text:p>
      </style:footer>
    </style:master-page>
  </office:master-styles>
</office:document-styles>`;

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Escapes text and converts embedded newlines into ODF line breaks. */
function escapeText(input: string): string {
  return input.split("\n").map(escapeXml).join("<text:line-break/>");
}

function buildContentXml(doc: ExportDocument): string {
  const paragraphs: string[] = [];
  if (doc.title) {
    paragraphs.push(
      `<text:p text:style-name="Title">${escapeXml(doc.title)}</text:p>`,
    );
  }
  paragraphs.push(
    ...doc.blocks.map((block) => {
      const prefix = blockPrefix(block);
      const prefixSpan = prefix
        ? `<text:span text:style-name="Bold">${escapeXml(prefix)} </text:span>`
        : "";
      return `<text:p>${prefixSpan}${escapeText(block.text)}</text:p>`;
    }),
  );

  // An empty paragraph between blocks/title renders as a blank line, mirroring
  // the "\n\n" separator used by the txt export — plain adjacent <text:p>
  // elements alone don't read as visually separated in LibreOffice/Word.
  const body = paragraphs.join("<text:p/>");

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${ODF_NAMESPACES} office:version="1.2">
  ${FONT_FACE_DECLS}
  <office:automatic-styles>
    <style:style style:name="Title" style:family="paragraph"><style:text-properties style:font-name="${DOCUMENT_FONT_NAME}" fo:font-size="20pt" fo:font-weight="bold"/></style:style>
    <style:style style:name="Bold" style:family="text"><style:text-properties style:font-name="${DOCUMENT_FONT_NAME}" fo:font-weight="bold"/></style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>${body}</office:text>
  </office:body>
</office:document-content>`;
}

/**
 * Builds a minimal but valid .odt (zip + OpenDocument XML) client-side —
 * title, bold "[timestamp] Speaker:" prefixes, plain paragraphs. There's no
 * backend endpoint that turns a transcription into an odt, unlike the
 * anonymizer flow, so this has to be generated here.
 */
export async function renderOdt(doc: ExportDocument): Promise<Blob> {
  const zip = new JSZip();
  // mimetype must be uncompressed and first in the archive per the ODF spec.
  zip.file("mimetype", ODT_MIME_TYPE, { compression: "STORE" });
  zip.folder("META-INF")?.file("manifest.xml", MANIFEST_XML);
  zip.file("content.xml", buildContentXml(doc));
  zip.file("styles.xml", STYLES_XML);

  return zip.generateAsync({ type: "blob", mimeType: ODT_MIME_TYPE });
}
