import type { JSONContent } from "@aymurai/ui";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  SUMMARY_WATERMARK_PREFIX_TEXT,
  WATERMARK_LINK_COLOR,
  WATERMARK_LINK_TEXT,
  WATERMARK_TEXT_COLOR,
  WATERMARK_URL,
} from "../watermark";
import { collectStyles, documentToOdt, paragraphToOdtXml } from "./odt";

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

// `toContain` checks on raw XML strings (used throughout this file) can't
// catch a malformed document — they'd happily pass even with an unbound
// namespace prefix, which is exactly the bug this guards against: `svg`
// used in FONT_FACE_DECLS but not declared in ODF_NAMESPACES, silently
// dropped by LibreOffice's lenient recovery parser (no visible error), which
// fell back to its own built-in defaults — Liberation instead of Archivo —
// for the *entire* document. A real XML parser catches this immediately.
function assertWellFormed(xml: string, label: string) {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = parsed.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      `${label} is not well-formed XML: ${parserError.textContent}`,
    );
  }
}

// Tiptap JSONContent fixture builders — mirror what RichTextEditor's
// `useEditor` actually produces (text nodes carrying a `marks` array, marks
// shaped as `{ type, attrs? }`, highlight color living in `attrs.color`).
function text(value: string, marks?: JSONContent["marks"]): JSONContent {
  return marks
    ? { type: "text", text: value, marks }
    : { type: "text", text: value };
}

function paragraph(...nodes: JSONContent[]): JSONContent {
  return { type: "paragraph", content: nodes };
}

function doc(...paragraphs: JSONContent[]): JSONContent {
  return { type: "doc", content: paragraphs };
}

describe("paragraphToOdtXml", () => {
  it("wraps plain text in a text:p with no span at all, explicitly styled Standard", () => {
    const p = paragraph(text("hola"));
    expect(paragraphToOdtXml(p, collectStyles(doc(p)))).toBe(
      '<text:p text:style-name="Standard">hola</text:p>',
    );
  });

  it("references a named style for a bold run instead of an inline style", () => {
    const p = paragraph(text("hola", [{ type: "bold" }]));
    const styles = collectStyles(doc(p));
    expect(paragraphToOdtXml(p, styles)).toBe(
      '<text:p text:style-name="Standard"><text:span text:style-name="T0">hola</text:span></text:p>',
    );
  });

  it("shares one style between runs with the same mark combination", () => {
    const p1 = paragraph(text("uno", [{ type: "bold" }]));
    const p2 = paragraph(text("dos", [{ type: "bold" }]));
    const styles = collectStyles(doc(p1, p2));

    expect(styles.size).toBe(1);
    expect(paragraphToOdtXml(p1, styles)).toBe(
      '<text:p text:style-name="Standard"><text:span text:style-name="T0">uno</text:span></text:p>',
    );
    expect(paragraphToOdtXml(p2, styles)).toBe(
      '<text:p text:style-name="Standard"><text:span text:style-name="T0">dos</text:span></text:p>',
    );
  });

  it("escapes XML-sensitive characters in the run text", () => {
    const p = paragraph(text("A & B < C"));
    expect(paragraphToOdtXml(p, collectStyles(doc(p)))).toBe(
      '<text:p text:style-name="Standard">A &amp; B &lt; C</text:p>',
    );
  });
});

describe("collectStyles", () => {
  it("assigns one style per distinct mark combination, not per run", () => {
    const document = doc(
      paragraph(
        text("a", [{ type: "bold" }]),
        text("b", [{ type: "bold" }, { type: "italic" }]),
        text("c", [{ type: "bold" }]),
      ),
    );
    expect(collectStyles(document).size).toBe(2);
  });

  it("gives a run with no marks no style entry", () => {
    const document = doc(paragraph(text("plain")));
    expect(collectStyles(document).size).toBe(0);
  });
});

describe("documentToOdt", () => {
  it("produces a zip with the required ODF entries", async () => {
    const document = doc(paragraph(text("Hola")));
    const blob = await documentToOdt(document, "Resumen");
    const buffer = await blobToArrayBuffer(blob);
    const zip = await JSZip.loadAsync(buffer);

    expect(zip.file("mimetype")).toBeTruthy();
    expect(zip.file("META-INF/manifest.xml")).toBeTruthy();
    expect(zip.file("content.xml")).toBeTruthy();
    expect(zip.file("styles.xml")).toBeTruthy();
  });

  it("stores the mimetype entry uncompressed and first, per the ODF spec", async () => {
    const document = doc(paragraph(text("Hola")));
    const buffer = await blobToArrayBuffer(
      await documentToOdt(document, "Resumen"),
    );
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    expect(names[0]).toBe("mimetype");
  });

  it("includes the title and the paragraph text in content.xml", async () => {
    const document = doc(paragraph(text("Hola mundo")));
    const xml = await readContentXml(
      await documentToOdt(document, "Audiencia"),
    );

    expect(xml).toContain("Audiencia");
    expect(xml).toContain("Hola mundo");
  });

  it("defines a named automatic style with the right text-properties for a bold run", async () => {
    const document = doc(paragraph(text("importante", [{ type: "bold" }])));
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));

    expect(xml).toContain(
      '<style:style style:name="T0" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>',
    );
    expect(xml).toContain(
      '<text:span text:style-name="T0">importante</text:span>',
    );
  });

  it("combines multiple marks on one run into a single style definition", async () => {
    const document = doc(
      paragraph(text("hola", [{ type: "bold" }, { type: "italic" }])),
    );
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));

    expect(xml).toContain(
      '<style:style style:name="T0" style:family="text"><style:text-properties fo:font-weight="bold" fo:font-style="italic"/></style:style>',
    );
    // Only one <text:span> around the run — not one per mark.
    expect(xml.match(/<text:span/g)?.length).toBe(1);
  });

  it("emits the standard ODF underline properties for an underline mark", async () => {
    const document = doc(paragraph(text("hola", [{ type: "underline" }])));
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));

    expect(xml).toContain('style:text-underline-style="solid"');
    expect(xml).toContain('style:text-underline-width="auto"');
    expect(xml).toContain('style:text-underline-color="font-color"');
  });

  it("converts a real hex highlight color into fo:background-color as-is", async () => {
    const document = doc(
      paragraph(
        text("hola", [{ type: "highlight", attrs: { color: "#FDE27B" } }]),
      ),
    );
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));
    expect(xml).toContain('fo:background-color="#FDE27B"');
  });

  it("converts a @aymurai/ui highlight design-token path into a real hex color", async () => {
    const document = doc(
      paragraph(
        text("hola", [
          { type: "highlight", attrs: { color: "category.green-light" } },
        ]),
      ),
    );
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));
    expect(xml).toContain('fo:background-color="#D1F4E2"');
    expect(xml).not.toContain("category.green-light");
  });

  it("falls back to a default hex color for an unrecognized highlight value", async () => {
    const document = doc(paragraph(text("hola", [{ type: "highlight" }])));
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));
    expect(xml).toMatch(/fo:background-color="#[0-9A-Fa-f]{6}"/);
  });

  it("escapes XML-sensitive characters in the title and body", async () => {
    const document = doc(paragraph(text("<script>A & B</script>")));
    const xml = await readContentXml(await documentToOdt(document, "A & B"));

    expect(xml).toContain("A &amp; B");
    expect(xml).not.toContain("<script>");
  });

  it("exports content nested under a list (bulletList > listItem > paragraph) as its own paragraph", async () => {
    const document = doc(paragraph(text("Intro")), {
      type: "bulletList",
      content: [
        { type: "listItem", content: [paragraph(text("Item uno"))] },
        { type: "listItem", content: [paragraph(text("Item dos"))] },
      ],
    });
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));

    expect(xml).toContain('<text:p text:style-name="Standard">Intro</text:p>');
    expect(xml).toContain(
      '<text:p text:style-name="Standard">Item uno</text:p>',
    );
    expect(xml).toContain(
      '<text:p text:style-name="Standard">Item dos</text:p>',
    );
  });

  it("declares Archivo as the document's font, in both content.xml and styles.xml", async () => {
    const document = doc(paragraph(text("Hola")));
    const blob = await documentToOdt(document, "Resumen");

    const contentXml = await readContentXml(blob);
    const stylesXml = await readStylesXml(blob);
    expect(contentXml).toContain(
      '<style:font-face style:name="Archivo" svg:font-family="Archivo"/>',
    );
    expect(stylesXml).toContain(
      '<style:font-face style:name="Archivo" svg:font-family="Archivo"/>',
    );
    expect(stylesXml).toContain(
      '<style:style style:name="Standard" style:family="paragraph">',
    );
    expect(stylesXml).toContain('style:font-name="Archivo"');
  });

  it("renders the title as an explicitly Archivo-styled paragraph, not a bare heading", async () => {
    // Regression check: a <text:h> with no text:style-name falls back to
    // the renderer's own built-in default "Heading 1" style (e.g.
    // LibreOffice's template default, commonly Liberation) instead of
    // anything this document declares — the title was rendering in the
    // wrong font until it became a plain, explicitly-styled paragraph, the
    // same way ../formatters/odt.ts's transcription title already works.
    const document = doc(paragraph(text("Hola")));
    const xml = await readContentXml(await documentToOdt(document, "Resumen"));

    expect(xml).not.toContain("<text:h");
    expect(xml).toContain('<text:p text:style-name="Title">Resumen</text:p>');
    expect(xml).toContain(
      '<style:style style:name="Title" style:family="paragraph"><style:text-properties style:font-name="Archivo" fo:font-size="20pt" fo:font-weight="bold"/></style:style>',
    );
  });

  it("produces well-formed content.xml and styles.xml (every namespace prefix used is declared)", async () => {
    const document = doc(
      paragraph(text("Hola", [{ type: "bold" }, { type: "italic" }])),
    );
    const blob = await documentToOdt(document, "Resumen");

    assertWellFormed(await readContentXml(blob), "content.xml");
    assertWellFormed(await readStylesXml(blob), "styles.xml");
  });

  it("adds a page footer watermark matching the transcription export's visual style", async () => {
    const xml = await readStylesXml(
      await documentToOdt(doc(paragraph(text("Hola"))), "Resumen"),
    );

    expect(xml).toContain(SUMMARY_WATERMARK_PREFIX_TEXT);
    expect(xml).toContain(`>${WATERMARK_LINK_TEXT}<`);
    expect(xml).toContain(`xlink:href="${WATERMARK_URL}"`);
    expect(xml).toContain(`fo:color="${WATERMARK_TEXT_COLOR}"`);
    expect(xml).toContain(`fo:color="${WATERMARK_LINK_COLOR}"`);
    expect(xml).toContain("<style:footer>");
    expect(xml).toContain(
      `<text:a xlink:href="${WATERMARK_URL}" text:style-name="FooterWatermarkLink"><text:span text:style-name="FooterWatermarkLink">${WATERMARK_LINK_TEXT}</text:span></text:a>`,
    );
  });
});
