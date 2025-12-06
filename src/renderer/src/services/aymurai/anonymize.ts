import type { PredictLabel } from "@/types/aymurai";
import type { DocFile } from "@/types/file";

interface Body {
  data: {
    // The paragraph
    document: string;
    labels: PredictLabel[];
  }[];
}

const body = (file: DocFile): Body => {
  const paragraphs = file.paragraphs ?? [];
  const labels = file.predictions ?? [];

  return {
    data: paragraphs.map((p) => ({
      document: p.value,
      labels: labels.filter((l) => l.paragraphId === p.id),
    })),
  };
};
