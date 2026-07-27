import type { JSONContent } from "@aymurai/ui";
import JSZip from "jszip";

const ODT_MIME_TYPE = "application/vnd.oasis.opendocument.text";

const ODF_NAMESPACES =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"';

const MANIFEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODT_MIME_TYPE}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

// Minimal but spec-valid — this export doesn't need the watermark/footer
// content the transcription formatter's styles.xml carries (see
// ../formatters/odt.ts), just a valid root so the archive isn't malformed.
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles ${ODF_NAMESPACES} office:version="1.2">
  <office:styles/>
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

  return `<text:p>${spans}</text:p>`;
}

function buildContentXml(document: JSONContent, title: string): string {
  const styles = collectStyles(document);
  const bodyXml = documentLeafBlocks(document)
    .map((block) => paragraphToOdtXml(block, styles))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${ODF_NAMESPACES}>
  <office:automatic-styles>${automaticStylesXml(styles)}</office:automatic-styles>
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${escapeXml(title)}</text:h>
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
 * Packaging mirrors ../formatters/odt.ts's `renderOdt` (mimetype stored
 * uncompressed and first, manifest, content.xml, styles.xml).
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
