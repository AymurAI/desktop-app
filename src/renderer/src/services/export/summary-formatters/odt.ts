import type { JSONContent } from "@aymurai/ui";
import JSZip from "jszip";
import {
  SUMMARY_WATERMARK_PREFIX_TEXT,
  WATERMARK_FONT_SIZE_PT,
  WATERMARK_LINK_COLOR,
  WATERMARK_LINK_TEXT,
  WATERMARK_TEXT_COLOR,
  WATERMARK_URL,
} from "../watermark";

const ODT_MIME_TYPE = "application/vnd.oasis.opendocument.text";

// Shared between content.xml and styles.xml's root elements — styles.xml
// additionally needs xlink (for the footer's hyperlink), content.xml doesn't.
// `svg` is required by FONT_FACE_DECLS's `svg:font-family` attribute — its
// absence here was an undeclared-namespace-prefix bug: the XML wasn't
// well-formed, so LibreOffice silently dropped the font-face-decls (and
// everything referencing them) during its lenient recovery parse instead of
// erroring, falling back to its own built-in defaults (Liberation) for the
// whole document, title included, no matter how correct the style
// declarations otherwise looked.
const ODF_NAMESPACES =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" ' +
  'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" ' +
  'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"';
const XLINK_NAMESPACE = 'xmlns:xlink="http://www.w3.org/1999/xlink"';

const MANIFEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODT_MIME_TYPE}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

// Matches the font used across AymurAI's other generated documents (see
// ../formatters/odt.ts and the backend's anonymization watermark scripts).
// Declared via font-face-decls and referenced by name only — if a
// reader/converter doesn't have Archivo installed, it silently falls back to
// a substitute rather than failing.
const DOCUMENT_FONT_NAME = "Archivo";
const FONT_FACE_DECLS = `<office:font-face-decls><style:font-face style:name="${DOCUMENT_FONT_NAME}" svg:font-family="${DOCUMENT_FONT_NAME}"/></office:font-face-decls>`;

// Footer watermark lives in styles.xml's master-page (ODF's footers are
// page-master content, not part of the document body) — its visual style
// mirrors ../formatters/odt.ts's own transcription watermark, which in turn
// mirrors the anonymizer's document watermark.
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles ${ODF_NAMESPACES} ${XLINK_NAMESPACE} office:version="1.2">
  ${FONT_FACE_DECLS}
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph">
      <style:text-properties style:font-name="${DOCUMENT_FONT_NAME}"/>
    </style:style>
    <style:style style:name="TableHeaderPara" style:family="paragraph">
      <style:text-properties style:font-name="${DOCUMENT_FONT_NAME}" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="TableCell" style:family="table-cell">
      <style:table-cell-properties fo:border="0.018cm solid #BCBAB8" fo:padding="0.15cm"/>
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
        <text:p text:style-name="FooterWatermark"><text:span text:style-name="FooterWatermarkText">${SUMMARY_WATERMARK_PREFIX_TEXT}</text:span><text:a xlink:href="${WATERMARK_URL}" text:style-name="FooterWatermarkLink"><text:span text:style-name="FooterWatermarkLink">${WATERMARK_LINK_TEXT}</text:span></text:a></text:p>
      </style:footer>
    </style:master-page>
  </office:master-styles>
</office:document-styles>`;

// `mark.attrs.color` on a highlight mark is a `@aymurai/ui` design-token path
// (e.g. "category.yellow-light" — see RICH_TEXT_HIGHLIGHT_COLORS in
// RichTextEditor.tsx), not a real color ODF's `fo:background-color` can use.
// This mirrors the hex values baked into the app's Panda preset
// (node_modules/@aymurai/ui/dist/preset.js) for those same tokens.
const HIGHLIGHT_COLOR_HEX: Record<string, string> = {
  "category.yellow-light": "#FFF2C6",
  "category.green-light": "#D1F4E2",
  "category.blue-light": "#CBF1FF",
  "category.violet-light": "#C5CAFF",
  "category.pink-light": "#FFD6FA",
  "category.orange-light": "#FFE2C4",
  "category.red-light": "#FFE2D9",
};
const DEFAULT_HIGHLIGHT_HEX = HIGHLIGHT_COLOR_HEX["category.yellow-light"];

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(value);
}

/**
 * Resolves a highlight mark's color to a real hex value ODF can use in
 * `fo:background-color`. Accepts an already-real hex value as-is (some
 * callers may store one directly), looks up known token paths, and falls
 * back to a sensible default rather than ever emitting an invalid value.
 */
function resolveHighlightColor(color?: string): string {
  if (!color) return DEFAULT_HIGHLIGHT_HEX;
  if (isHexColor(color)) return color;
  return HIGHLIGHT_COLOR_HEX[color] ?? DEFAULT_HIGHLIGHT_HEX;
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** A Tiptap text-node mark, e.g. `{ type: "bold" }` or `{ type: "highlight", attrs: { color: "..." } }`. */
interface OdtMark {
  type: string;
  attrs?: { color?: string };
}

// Fixed ordering so a run's mark combination produces the same style
// regardless of the order marks were applied/stored in.
const MARK_ORDER = ["bold", "italic", "underline", "highlight"];

function sortMarks(marks: OdtMark[]): OdtMark[] {
  return [...marks].sort(
    (a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type),
  );
}

/** Stable key identifying a distinct mark combination, for style dedup. */
function markKey(marks: OdtMark[]): string {
  return sortMarks(marks)
    .map((mark) =>
      mark.type === "highlight"
        ? `highlight:${resolveHighlightColor(mark.attrs?.color)}`
        : mark.type,
    )
    .join("|");
}

function textPropertiesXml(marks: OdtMark[]): string {
  const properties: string[] = [];
  for (const mark of sortMarks(marks)) {
    switch (mark.type) {
      case "bold":
        properties.push('fo:font-weight="bold"');
        break;
      case "italic":
        properties.push('fo:font-style="italic"');
        break;
      case "underline":
        properties.push(
          'style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"',
        );
        break;
      case "highlight":
        properties.push(
          `fo:background-color="${resolveHighlightColor(mark.attrs?.color)}"`,
        );
        break;
    }
  }
  return properties.join(" ");
}

export interface OdtStyleEntry {
  name: string;
  marks: OdtMark[];
}

/**
 * A "leaf" block is one whose own children are text nodes (or has no
 * children at all, e.g. a blank paragraph) — the unit we render as one
 * `<text:p>`. Recursing through non-leaf children handles content nested
 * under list items (`bulletList > listItem > paragraph`) or similar
 * wrappers, so a list created via markdown shortcuts while editing doesn't
 * silently vanish from the export — this export has no ODF list markup of
 * its own, so list items just become their own paragraphs.
 */
function collectLeafBlocks(node: JSONContent, out: JSONContent[]): void {
  const content = node.content ?? [];
  if (content.length === 0) {
    if (node.type) out.push(node);
    return;
  }
  if (content.every((child) => child.type === "text")) {
    out.push(node);
    return;
  }
  for (const child of content) collectLeafBlocks(child, out);
}

function documentLeafBlocks(document: JSONContent): JSONContent[] {
  const blocks: JSONContent[] = [];
  for (const child of document.content ?? []) collectLeafBlocks(child, blocks);
  return blocks;
}

function blockMarks(block: JSONContent): OdtMark[][] {
  return (block.content ?? [])
    .filter((node) => node.type === "text")
    .map((node) => (node.marks ?? []) as OdtMark[]);
}

/**
 * Walks every text node in every (recursively found) leaf block and assigns
 * one named automatic style per distinct mark combination (e.g. `[bold]`,
 * `[bold,italic]`, `[highlight,color:...]`), so identical combinations share
 * a single `<style:style>` definition instead of duplicating inline styles
 * per run.
 */
export function collectStyles(
  document: JSONContent,
): Map<string, OdtStyleEntry> {
  const registry = new Map<string, OdtStyleEntry>();
  for (const block of documentLeafBlocks(document)) {
    for (const marks of blockMarks(block)) {
      if (marks.length === 0) continue;
      const key = markKey(marks);
      if (!registry.has(key)) {
        registry.set(key, { name: `T${registry.size}`, marks });
      }
    }
  }
  return registry;
}

function automaticStylesXml(styles: Map<string, OdtStyleEntry>): string {
  return Array.from(styles.values())
    .map(
      (entry) =>
        `<style:style style:name="${entry.name}" style:family="text"><style:text-properties ${textPropertiesXml(entry.marks)}/></style:style>`,
    )
    .join("");
}

/**
 * Renders one leaf block's text nodes as `<text:p>` with `<text:span
 * text:style-name="...">` for marked runs — referencing the named styles in
 * `styles` — and no span at all for plain runs.
 */
export function paragraphToOdtXml(
  block: JSONContent,
  styles: Map<string, OdtStyleEntry>,
  paragraphStyleName = "Standard",
): string {
  const spans = (block.content ?? [])
    .filter((node) => node.type === "text")
    .map((node) => {
      const text = escapeXml(node.text ?? "");
      const marks = (node.marks ?? []) as OdtMark[];
      if (marks.length === 0) return text;
      const entry = styles.get(markKey(marks));
      // `styles` is always built from the same document via collectStyles,
      // so every marked run has a matching entry; this is just a safe
      // fallback in case a caller passes a mismatched registry.
      if (!entry) return text;
      return `<text:span text:style-name="${entry.name}">${text}</text:span>`;
    })
    .join("");

  // Explicit, not relying on an unstyled <text:p> implicitly picking up
  // "Standard" — LibreOffice does NOT reliably do that (confirmed by
  // opening a real export: body paragraphs rendered in Liberation Serif,
  // its own built-in default, even though "Standard" was declared with
  // Archivo in styles.xml). Every mark span above inherits font-name from
  // here too, since none of them set their own.
  return `<text:p text:style-name="${paragraphStyleName}">${spans}</text:p>`;
}

/**
 * Renders a `table` node as a real ODF table (`table:table` /
 * `table:table-row` / `table:table-cell`) instead of letting the generic
 * leaf-block walk flatten every cell into its own top-level paragraph, which
 * preserves the text but loses the grid entirely. The first row is bolded
 * (matching RichTextEditor's own `& th` styling) whenever it's made of
 * `tableHeader` cells, or whenever there's more than one row — a lone,
 * header-less single-row table has no "body" to visually distinguish it from.
 */
function tableToOdtXml(
  table: JSONContent,
  styles: Map<string, OdtStyleEntry>,
): string {
  const rows = table.content ?? [];
  if (rows.length === 0) return "";

  const columnCount = Math.max(
    1,
    ...rows.map((row) => (row.content ?? []).length),
  );
  const columnsXml = `<table:table-column table:number-columns-repeated="${columnCount}"/>`;

  const rowsXml = rows
    .map((row, rowIndex) => {
      const cellsXml = (row.content ?? [])
        .map((cell) => {
          const isHeader =
            cell.type === "tableHeader" || (rowIndex === 0 && rows.length > 1);
          const paragraphStyleName = isHeader ? "TableHeaderPara" : "Standard";
          const cellLeaves: JSONContent[] = [];
          for (const child of cell.content ?? [])
            collectLeafBlocks(child, cellLeaves);
          const cellBodyXml =
            cellLeaves
              .map((leaf) =>
                paragraphToOdtXml(leaf, styles, paragraphStyleName),
              )
              .join("") || `<text:p text:style-name="${paragraphStyleName}"/>`;
          return `<table:table-cell table:style-name="TableCell" office:value-type="string">${cellBodyXml}</table:table-cell>`;
        })
        .join("");
      return `<table:table-row>${cellsXml}</table:table-row>`;
    })
    .join("");

  return `<table:table>${columnsXml}${rowsXml}</table:table>`;
}

/** Renders one top-level document block — a table as a real ODF table,
 * anything else via the generic leaf-block walk (paragraphs, headings, and
 * list items alike, which this export flattens to plain paragraphs — see
 * `collectLeafBlocks`). */
function blockToOdtXml(
  node: JSONContent,
  styles: Map<string, OdtStyleEntry>,
): string {
  if (node.type === "table") return tableToOdtXml(node, styles);
  const leaves: JSONContent[] = [];
  collectLeafBlocks(node, leaves);
  return leaves.map((leaf) => paragraphToOdtXml(leaf, styles)).join("\n");
}

// Matches ../formatters/odt.ts's own "Title" style exactly (20pt bold
// Archivo). The title is rendered as a plain, explicitly-styled <text:p> —
// not a <text:h> — for the same reason: an ODF heading with no
// text:style-name falls back to the renderer's *built-in* default "Heading
// 1" style (LibreOffice's own template, not anything declared in this
// document), which ignores our Standard/Archivo declaration entirely and is
// exactly why the title alone was rendering in Liberation instead of
// Archivo — every other paragraph here has no style-name either, but that
// convention only works for the paragraph family, not headings.
const TITLE_STYLE_XML = `<style:style style:name="Title" style:family="paragraph"><style:text-properties style:font-name="${DOCUMENT_FONT_NAME}" fo:font-size="20pt" fo:font-weight="bold"/></style:style>`;

function buildContentXml(document: JSONContent, title: string): string {
  const styles = collectStyles(document);
  const bodyXml = (document.content ?? [])
    .map((node) => blockToOdtXml(node, styles))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${ODF_NAMESPACES} office:version="1.2">
  ${FONT_FACE_DECLS}
  <office:automatic-styles>${TITLE_STYLE_XML}${automaticStylesXml(styles)}</office:automatic-styles>
  <office:body>
    <office:text>
      <text:p text:style-name="Title">${escapeXml(title)}</text:p>
      ${bodyXml}
    </office:text>
  </office:body>
</office:document-content>`;
}

/**
 * Builds a real .odt (zip + valid ODF markup) from a summary's Tiptap
 * `JSONContent` document. Marks (bold/italic/underline/highlight+color) are
 * translated into named automatic `<style:style>` definitions referenced via
 * `text:style-name`, per the ODF spec — see collectStyles/paragraphToOdtXml.
 * The whole document defaults to Archivo (via the "Standard" paragraph
 * style) and carries a "Resumen generado por AymurAI" footer watermark,
 * linked to the AymurAI site. Packaging mirrors ../formatters/odt.ts's
 * `renderOdt` (mimetype stored uncompressed and first, manifest, content.xml,
 * styles.xml).
 */
export async function documentToOdt(
  document: JSONContent,
  title: string,
): Promise<Blob> {
  const zip = new JSZip();
  zip.file("mimetype", ODT_MIME_TYPE, { compression: "STORE" });
  zip.folder("META-INF")?.file("manifest.xml", MANIFEST_XML);
  zip.file("content.xml", buildContentXml(document, title));
  zip.file("styles.xml", STYLES_XML);

  return zip.generateAsync({ type: "blob", mimeType: ODT_MIME_TYPE });
}
