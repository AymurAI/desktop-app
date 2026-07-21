import type { PredictStatus } from "@/hooks/usePredict";
import { css } from "@/styled/css";
import type { DocFile } from "@/types/file";
import { formatFileSize } from "@/utils/file";
import { ArchiveRow, ArchiveView, Button } from "@aymurai/ui";
import { File as FileIcon, Trash } from "phosphor-react";
import { useTranslation } from "react-i18next";

const escapeMarkup = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const previewDataUri = (file: DocFile) => {
  const text = file.paragraphs?.map((paragraph) => paragraph.value).join("\n");
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="367" height="426"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;padding:16px;font-family:sans-serif;font-size:12px;line-height:1.4;color:#110041;white-space:pre-wrap;overflow:hidden">${escapeMarkup(text?.slice(0, 4000) ?? "")}</div></foreignObject></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
};

const layout = css({
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  gap: "6",
});
const row = css({ maxW: "[367px]", minH: "10" });
const rowPlaceholder = css({ w: "full", maxW: "[367px]", h: "10" });
const errorMessage = css({
  display: "flex",
  alignItems: "center",
  minH: "10",
  color: "system.error",
});
// Preserve the 367:426 frame while leaving room for both app bars and card chrome.
const preview = css({
  "& > div:first-child": {
    h: "[clamp(200px,calc(100dvh - 550px),426px)]",
    w: "[clamp(172px,calc(86.15dvh - 474px),367px)]",
  },
});

interface Props {
  file: DocFile;
  status: PredictStatus;
  onRemove: () => void;
}

export default function FilePreview({ file, status, onRemove }: Props) {
  const { t } = useTranslation("common");
  const isError = status === "error";

  if (isError) {
    return (
      <div className={layout}>
        <ArchiveView
          type="preview-error"
          size="lg"
          fileName={file.data.name}
          selectable={false}
          className={preview}
        />
        <p className={errorMessage}>{t("filePreview.loadError")}</p>
      </div>
    );
  }

  if (status === "processing" || !file.paragraphs) {
    return (
      <div className={layout}>
        <ArchiveView
          type="preview-loading"
          size="lg"
          fileName={file.data.name}
          selectable={false}
          className={preview}
        />
        <div className={rowPlaceholder} aria-hidden />
      </div>
    );
  }

  const paragraphCount = file.paragraphs.length;

  return (
    <div className={layout}>
      <ArchiveView
        type="preview"
        size="lg"
        src={previewDataUri(file)}
        fileName={file.data.name}
        selectable={false}
        className={preview}
      />
      <ArchiveRow
        className={row}
        icon={<FileIcon size={24} />}
        title={file.data.name}
        description={t("filePreview.meta", {
          count: paragraphCount,
          size: formatFileSize(file.data.size),
        })}
        trailingAction={
          <Button
            variant="tertiary"
            size="icon-sm"
            aria-label={t("filePreview.removeAria", { name: file.data.name })}
            onClick={onRemove}
          >
            <Trash size={24} />
          </Button>
        }
      />
    </div>
  );
}
