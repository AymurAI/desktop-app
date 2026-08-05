import {
  Outlet,
  createFileRoute,
  redirect,
  useParams,
} from "@tanstack/react-router";
import { z } from "zod";

import FileProvider from "@/context/File";
import SummaryProvider from "@/context/Summary";
import TranscriptionProvider from "@/context/Transcription";
import APIProtected from "@/features/APIProtected";
import { Stack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";

// Validation schema for feature parameter
const featureParamSchema = z.object({
  feature: z.enum([
    FeatureFlowEnum.Dataset,
    FeatureFlowEnum.Anonymizer,
    FeatureFlowEnum.VoiceToText,
    FeatureFlowEnum.Recomendaciones,
    FeatureFlowEnum.Summarizer,
  ]),
});

export const Route = createFileRoute("/app/$feature")({
  // Parse and validate params
  params: {
    parse: (params) => {
      try {
        return featureParamSchema.parse(params);
      } catch {
        throw redirect({ to: "/home/features" });
      }
    },
    stringify: (params) => params,
  },
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  const { feature } = useParams({ from: "/app/$feature" });
  const isVoice = feature === FeatureFlowEnum.VoiceToText;
  const isSummarizer = feature === FeatureFlowEnum.Summarizer;
  const inner = (
    <Stack
      width="screen"
      height="screen"
      minHeight="0"
      gap="0"
      overflow="hidden"
    >
      <FileProvider>
        <Outlet key={feature} />
      </FileProvider>
    </Stack>
  );
  const wrapped = isVoice ? (
    <TranscriptionProvider>{inner}</TranscriptionProvider>
  ) : isSummarizer ? (
    <SummaryProvider>{inner}</SummaryProvider>
  ) : (
    inner
  );
  return <APIProtected>{wrapped}</APIProtected>;
}
