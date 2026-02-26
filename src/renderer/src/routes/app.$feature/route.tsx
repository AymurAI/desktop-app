import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { z } from "zod";

import FeaturesMenu from "@/components/features-menu";
import Stepper from "@/components/home/stepper";
import HowItWorksModal from "@/components/how-it-works-modal";
import Header from "@/components/layout/header";
import FileProvider from "@/context/File";
import { useTutorialSeen } from "@/store/useLocal";
import { HStack, Stack } from "@/styled/jsx";
import { FeatureFlowEnum, featureName } from "@/types/features";

// Validation schema for feature parameter
const featureParamSchema = z.object({
  feature: z.enum([FeatureFlowEnum.Dataset, FeatureFlowEnum.Anonymizer]),
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
  const { feature } = Route.useParams();
  const location = useLocation();
  const tutorialSeen = useTutorialSeen(feature);

  let currentStep = 1;
  const path = location.pathname;
  if (path.includes("/process")) currentStep = 2;
  else if (path.includes("/validation")) currentStep = 3;
  else if (path.includes("/finish")) currentStep = 4;

  return (
    <Stack width="screen" height="screen" gap="0">
      <Header
        title={featureName(feature)}
        center={<Stepper currentStep={currentStep} feature={feature} />}
        right={
          <HStack>
            {tutorialSeen && <HowItWorksModal feature={feature} />}
            <FeaturesMenu />
          </HStack>
        }
      />
      <FileProvider>
        <Outlet />
      </FileProvider>
    </Stack>
  );
}
