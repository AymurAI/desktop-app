import type {
  RichTextDocument,
  RichTextParagraph,
  TextMark,
} from "@aymurai/ui";

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markToStyle(mark: TextMark): string {
  if (mark.type === "bold") return "font-weight:bold;";
  if (mark.type === "italic") return "font-style:italic;";
  if (mark.type === "underline") return "text-decoration:underline;";
  return `background-color:${mark.color ?? "#FDE27B"};`;
}

export function paragraphToOdtXml(paragraph: RichTextParagraph): string {
  const spans = paragraph.runs
    .map((run) => {
      const text = escapeXml(run.text);
      if (run.marks.length === 0) return text;
      const style = run.marks.map(markToStyle).join("");
      return `<text:span style="${style}">${text}</text:span>`;
    })
    .join("");

  return `<text:p>${spans}</text:p>`;
}

const ODT_CONTENT_TEMPLATE = (
  bodyXml: string,
  title: string,
) => `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${escapeXml(title)}</text:h>
      ${bodyXml}
    </office:text>
  </office:body>
</office:document-content>`;

export function documentToOdt(document: RichTextDocument, title: string): Blob {
  const bodyXml = document.paragraphs.map(paragraphToOdtXml).join("\n");
  const contentXml = ODT_CONTENT_TEMPLATE(bodyXml, title);
  return new Blob([contentXml], {
    type: "application/vnd.oasis.opendocument.text",
  });
}
