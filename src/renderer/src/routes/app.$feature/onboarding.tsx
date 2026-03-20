import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

import DropArea from "@/components/drop-area";
import FeaturesMenu from "@/components/features-menu";
import HiddenInput from "@/components/hidden-input";
import HowItWorks from "@/components/how-it-works";
import HowItWorksModal from "@/components/how-it-works-modal";
import Stepper from "@/components/home/stepper";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import { useFileDispatch } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { addFiles } from "@/reducers/file/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum, featureName } from "@/types/features";
import { useRef } from "react";

// FIRST step of the processing workflow
export const Route = createFileRoute("/app/$feature/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({
    from: "/app/$feature/onboarding",
  });
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);

  const dispatch = useFileDispatch();
  const tutorialSeen = useTutorialSeen(feature);
  const toggleTutorialSeen = useSetTutorialSeen();

  const handleAddFiles = async (files: File[]) => {
    dispatch(addFiles(files));
    await navigate({
      to: "/app/$feature/preview",
      params: { feature },
    });
    toggleTutorialSeen(feature);
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles) handleAddFiles(Array.from(rawFiles));
  };

  const handleOpenInput = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Header
        title={featureName(feature)}
        center={
          feature === FeatureFlowEnum.Dataset ? (
            <Stepper currentStep={1} />
          ) : undefined
        }
        right={
          <HStack>
            {tutorialSeen && <HowItWorksModal feature={feature} />}
            <FeaturesMenu />
          </HStack>
        }
      />
      <MainContent>
        {tutorialSeen ? (
          <Stack gap="8">
            <HStack alignItems="center" gap="6">
              <BackButton to="/home/features" />
              <SectionTitle>1. Selección de Archivos</SectionTitle>
            </HStack>
            <DropArea onDropFiles={handleAddFiles} />
          </Stack>
        ) : (
          <HowItWorks feature={feature} />
        )}
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          {!tutorialSeen && (
            <styled.p textStyle="paragraph.sm.default">
              Formatos válidos: .doc y .docx
            </styled.p>
          )}
          <Button onClick={handleOpenInput}>Cargar documentos</Button>
        </HStack>
      </Footer>
      <HiddenInput ref={inputRef} onChange={handleInputChange} />
    </>
  );
}
