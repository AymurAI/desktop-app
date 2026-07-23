import type { RichTextDocument, RichTextParagraph } from "@aymurai/ui";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
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

describe("paragraphToOdtXml", () => {
  it("wraps plain text in a text:p with no span at all", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [] }],
    };
    expect(paragraphToOdtXml(p, collectStyles({ paragraphs: [p] }))).toBe(
      "<text:p>hola</text:p>",
    );
  });

  it("references a named style for a bold run instead of an inline style", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [{ type: "bold" }] }],
    };
    const styles = collectStyles({ paragraphs: [p] });
    expect(paragraphToOdtXml(p, styles)).toBe(
      '<text:p><text:span text:style-name="T0">hola</text:span></text:p>',
    );
  });

  it("shares one style between runs with the same mark combination", () => {
    const p1: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "uno", marks: [{ type: "bold" }] }],
    };
    const p2: RichTextParagraph = {
      id: "p1",
      runs: [{ text: "dos", marks: [{ type: "bold" }] }],
    };
    const doc: RichTextDocument = { paragraphs: [p1, p2] };
    const styles = collectStyles(doc);

    expect(styles.size).toBe(1);
    expect(paragraphToOdtXml(p1, styles)).toBe(
      '<text:p><text:span text:style-name="T0">uno</text:span></text:p>',
    );
    expect(paragraphToOdtXml(p2, styles)).toBe(
      '<text:p><text:span text:style-name="T0">dos</text:span></text:p>',
    );
  });

  it("escapes XML-sensitive characters in the run text", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "A & B < C", marks: [] }],
    };
    expect(paragraphToOdtXml(p, collectStyles({ paragraphs: [p] }))).toBe(
      "<text:p>A &amp; B &lt; C</text:p>",
    );
  });
});

describe("collectStyles", () => {
  it("assigns one style per distinct mark combination, not per run", () => {
    const doc: RichTextDocument = {
      paragraphs: [
        {
          id: "p0",
          runs: [
            { text: "a", marks: [{ type: "bold" }] },
            { text: "b", marks: [{ type: "bold" }, { type: "italic" }] },
            { text: "c", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };
    const styles = collectStyles(doc);
    expect(styles.size).toBe(2);
  });

  it("gives a run with no marks no style entry", () => {
    const doc: RichTextDocument = {
      paragraphs: [{ id: "p0", runs: [{ text: "plain", marks: [] }] }],
    };
    expect(collectStyles(doc).size).toBe(0);
  });
});

describe("documentToOdt", () => {
  it("produces a zip with the required ODF entries", async () => {
    const doc: RichTextDocument = {
      paragraphs: [{ id: "p0", runs: [{ text: "Hola", marks: [] }] }],
    };
    const blob = await documentToOdt(doc, "Resumen");
    const buffer = await blobToArrayBuffer(blob);
    const zip = await JSZip.loadAsync(buffer);

    expect(zip.file("mimetype")).toBeTruthy();
    expect(zip.file("META-INF/manifest.xml")).toBeTruthy();
    expect(zip.file("content.xml")).toBeTruthy();
    expect(zip.file("styles.xml")).toBeTruthy();
  });

  it("stores the mimetype entry uncompressed and first, per the ODF spec", async () => {
    const doc: RichTextDocument = {
      paragraphs: [{ id: "p0", runs: [{ text: "Hola", marks: [] }] }],
    };
    const buffer = await blobToArrayBuffer(await documentToOdt(doc, "Resumen"));
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    expect(names[0]).toBe("mimetype");
  });

  it("includes the title and the paragraph text in content.xml", async () => {
    const doc: RichTextDocument = {
      paragraphs: [{ id: "p0", runs: [{ text: "Hola mundo", marks: [] }] }],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Audiencia"));

    expect(xml).toContain("Audiencia");
    expect(xml).toContain("Hola mundo");
  });

  it("defines a named automatic style with the right text-properties for a bold run", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        { id: "p0", runs: [{ text: "importante", marks: [{ type: "bold" }] }] },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Resumen"));

    expect(xml).toContain(
      '<style:style style:name="T0" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>',
    );
    expect(xml).toContain(
      '<text:span text:style-name="T0">importante</text:span>',
    );
  });

  it("combines multiple marks on one run into a single style definition", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        {
          id: "p0",
          runs: [
            {
              text: "hola",
              marks: [{ type: "bold" }, { type: "italic" }],
            },
          ],
        },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Resumen"));

    expect(xml).toContain(
      '<style:style style:name="T0" style:family="text"><style:text-properties fo:font-weight="bold" fo:font-style="italic"/></style:style>',
    );
    // Only one <text:span> around the run — not one per mark.
    expect(xml.match(/<text:span/g)?.length).toBe(1);
  });

  it("emits the standard ODF underline properties for an underline mark", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        { id: "p0", runs: [{ text: "hola", marks: [{ type: "underline" }] }] },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Resumen"));

    expect(xml).toContain('style:text-underline-style="solid"');
    expect(xml).toContain('style:text-underline-width="auto"');
    expect(xml).toContain('style:text-underline-color="font-color"');
  });

  it("converts a real hex highlight color into fo:background-color as-is", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        {
          id: "p0",
          runs: [
            { text: "hola", marks: [{ type: "highlight", color: "#FDE27B" }] },
          ],
        },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Resumen"));
    expect(xml).toContain('fo:background-color="#FDE27B"');
  });

  it("converts a @aymurai/ui highlight design-token path into a real hex color", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        {
          id: "p0",
          runs: [
            {
              text: "hola",
              marks: [{ type: "highlight", color: "category.green-light" }],
            },
          ],
        },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Resumen"));
    expect(xml).toContain('fo:background-color="#D1F4E2"');
    expect(xml).not.toContain("category.green-light");
  });

  it("falls back to a default hex color for an unrecognized highlight value", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        {
          id: "p0",
          runs: [{ text: "hola", marks: [{ type: "highlight" }] }],
        },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "Resumen"));
    expect(xml).toMatch(/fo:background-color="#[0-9A-Fa-f]{6}"/);
  });

  it("escapes XML-sensitive characters in the title and body", async () => {
    const doc: RichTextDocument = {
      paragraphs: [
        { id: "p0", runs: [{ text: "<script>A & B</script>", marks: [] }] },
      ],
    };
    const xml = await readContentXml(await documentToOdt(doc, "A & B"));

    expect(xml).toContain("A &amp; B");
    expect(xml).not.toContain("<script>");
  });
});
