import { SectionTitle } from "@/layout/section-title";
import { Grid, Stack, styled } from "@/styled/jsx";
import { type FeatureFlowEnum, featureNamespace } from "@/types/features";
import { Card } from "@aymurai/ui";
import type React from "react";
import { useTranslation } from "react-i18next";
import MainContent from "../layout/main-content";

interface FinishMainContentProps {
  feature: FeatureFlowEnum;
  children: React.ReactNode;
}
export default function FinishMainContent({
  feature,
  children,
}: FinishMainContentProps) {
  const { t } = useTranslation(featureNamespace[feature]);
  return (
    <MainContent>
      <Stack gap={{ base: "4", xl: "10" }}>
        <Stack gap="4">
          <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
          <styled.h2 textStyle="paragraph.md.default" maxW="8/12">
            {t("finish.description")}
          </styled.h2>
        </Stack>
        <Card>
          <Stack gap={{ base: "4", xl: "8" }}>
            <styled.h2 textStyle="subtitle.md.default">
              {t("finish.subtitle")}
            </styled.h2>
            {/*
              No Figma coverage below 1440 - EXTRAPOLATED, pending design
              review (tasks/responsive/plan.md RSP-10). `columns` as a
              responsive object is a proven pattern: summary-validation.tsx
              shipped `columns={{ base: 1, lg: 2, desktop: 2 }}` (RSP-09) and
              its tracks were measured in a real browser.
            */}
            <Grid
              columns={{ base: 2, lg: 4 }}
              gap="8"
              justifyContent="center"
              width="full"
            >
              {children}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </MainContent>
  );
}
