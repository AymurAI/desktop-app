import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import FileProvider from "@/context/File";
import { Stack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";

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

  return (
    <Stack width="screen" height="screen" gap="0">
      <FileProvider>
        <Outlet />
      </FileProvider>
    </Stack>
  );
}
