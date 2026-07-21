/**
 * Visual style mirrors the anonymizer's existing document watermark (see
 * aymurai backend's `text/anonymization/{pdf,docx}/watermark.py`): a gray
 * prefix followed by a bold, underlined, blue "AymurAI" link. The wording is
 * adapted here — this transcription was generated, not anonymized.
 */
export const WATERMARK_PREFIX_TEXT = "Transcripción generada por ";
export const WATERMARK_LINK_TEXT = "AymurAI";
export const WATERMARK_URL = "https://www.aymurai.info/";
export const WATERMARK_TEXT = `${WATERMARK_PREFIX_TEXT}${WATERMARK_LINK_TEXT}`;
export const WATERMARK_TEXT_COLOR = "#C0C0C0";
export const WATERMARK_LINK_COLOR = "#73BEFA";
export const WATERMARK_FONT_SIZE_PT = 10;
