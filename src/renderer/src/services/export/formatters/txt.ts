import type { ExportBlock, ExportDocument } from "../types";
import { WATERMARK_TEXT } from "../watermark";
import { blockPrefix } from "./block-prefix";

function renderBlockLine(block: ExportBlock): string {
  const prefix = blockPrefix(block);
  return prefix ? `${prefix} ${block.text}` : block.text;
}

export function renderTxt(doc: ExportDocument): string {
  const parts: string[] = [];
  if (doc.title) parts.push(doc.title);
  parts.push(...doc.blocks.map(renderBlockLine));
  parts.push(WATERMARK_TEXT);
  return parts.join("\n\n");
}
