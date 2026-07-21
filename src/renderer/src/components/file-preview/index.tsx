import { useFileDispatch } from "@/hooks";
import type { PredictStatus } from "@/hooks/usePredict";
import { toggleSelected } from "@/reducers/file/actions";
import { css, cx } from "@/styled/css";
import type { DocFile } from "@/types/file";

import { FeatureFlowEnum } from "@/types/features";
import { ArchiveView, Spinner } from "@aymurai/ui";
import { useParams } from "@tanstack/react-router";

const loadingPreview = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "[157px]",
  height: "[192px]",
  rounded: "md",
  borderWidth: "[4px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  bg: "bg.secondary",
});

const withoutSelection = css({
  "& button[role='checkbox']": { display: "none" },
});

const escapeMarkup = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const previewDataUri = (file: DocFile) => {
  const text = file.paragraphs?.map((paragraph) => paragraph.value).join("\n");
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="157" height="192"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;padding:8px;font-family:sans-serif;font-size:8px;line-height:1.25;color:#110041;white-space:pre-wrap;overflow:hidden">${escapeMarkup(text?.slice(0, 1800) ?? "")}</div></foreignObject></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
};

interface Props {
  file: DocFile;
  status: PredictStatus;
}
export default function FilePreview({ file, status }: Props) {
  const { feature } = useParams({ from: "/app/$feature/preview" });
  const dispatch = useFileDispatch();

  const isAnonymizer = feature === FeatureFlowEnum.Anonymizer;
  const moreThanOneParagraph = file.paragraphs && file.paragraphs.length > 1;
  const isSelectable = !isAnonymizer && moreThanOneParagraph;
  const isError = status === "error";
  const isPending = status === "processing";

  if (isError) {
    return (
      <ArchiveView
        fileName={file.data.name}
        type="preview-error"
        src={file.paragraphs ? previewDataUri(file) : undefined}
        className={withoutSelection}
      />
    );
  }

  if (isPending || !file.paragraphs) {
    return (
      <div className={loadingPreview} aria-label={file.data.name}>
        <Spinner />
      </div>
    );
  }

  return (
    <ArchiveView
      fileName={file.data.name}
      type="preview"
      src={previewDataUri(file)}
      selected={file.selected}
      onSelect={
        isSelectable
          ? () => dispatch(toggleSelected(file.data.name))
          : undefined
      }
      className={cx(!isSelectable && withoutSelection)}
    />
  );
}
