import FinishAnonymizer from "@/components/finish/finish-anonymizer";
import FinishDataset from "@/components/finish/finish-dataset";
import Header from "@/components/layout/header";
import RequireFile from "@/features/RequireFile";
import RequireSummary from "@/features/RequireSummary";
import { useFileDispatch } from "@/hooks";
import { removeAllFiles } from "@/reducers/file/actions";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import SummaryFinish from "@/components/summarizer/summary-finish";
import VoiceFinish from "@/components/voice-to-text/finish";

export const Route = createFileRoute("/app/$feature/finish")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = useParams({ from: "/app/$feature/finish" });
  if (params.feature === FeatureFlowEnum.VoiceToText) return <VoiceFinish />;
  if (params.feature === FeatureFlowEnum.Summarizer)
    return (
      <RequireFile>
        <RequireSummary>
          <SummaryFinish />
        </RequireSummary>
      </RequireFile>
    );
  return <DocumentFinish />;
}

function DocumentFinish() {
  const navigate = useNavigate();
  const params = useParams({ from: "/app/$feature/finish" });
  const { feature } = params;

  const { t } = useTranslation(featureNamespace[feature]);
  const dispatch = useFileDispatch();

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate({ to: "/app/$feature/onboarding", params });
  };

  return (
    <RequireFile>
      <Header title={t("title")} currentStep={4} feature={feature} />

      {feature === FeatureFlowEnum.Dataset ? (
        <FinishDataset onRestart={handleRestart} />
      ) : (
        <FinishAnonymizer onRestart={handleRestart} />
      )}
    </RequireFile>
  );
}
