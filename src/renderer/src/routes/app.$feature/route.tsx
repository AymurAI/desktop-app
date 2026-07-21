import {
  Outlet,
  createFileRoute,
  redirect,
  useParams,
} from "@tanstack/react-router";
import { z } from "zod";

import FileProvider from "@/context/File";
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
  const inner = (
    <Stack width="screen" height="screen" gap="0">
      <FileProvider>
        <Outlet key={feature} />
      </FileProvider>
    </Stack>
  );
  return (
    <APIProtected>
      {isVoice ? <TranscriptionProvider>{inner}</TranscriptionProvider> : inner}
    </APIProtected>
  );
}
