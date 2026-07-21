/**
 * Formats bytes using kb below 1mb, mb below 1gb, and gb from that point on.
 */
export default function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} kb`;

  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} mb`;

  return `${(mb / 1024).toFixed(1)} gb`;
}
