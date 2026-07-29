import BuiltBy from "@/components/brand/built-by";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import ReadingColumn from "@/components/layout/reading-column";
import { FEATURE_ICON } from "@/constants/config";
import APIProtected from "@/features/APIProtected";
import { css } from "@/styled/css";
import { Grid, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { CardTool } from "@aymurai/ui";
import {
  Link,
  type LinkComponentProps,
  createFileRoute,
} from "@tanstack/react-router";
import type { Icon } from "phosphor-react";
import { useTranslation } from "react-i18next";

// Arbitrary card min-height (RSP-11); no sizes token matches it exactly, so
// it stays a raw escape (RSP-12a).
const featureCard = css({ minH: "[195px]" });

interface FeatureCardLinkProps extends LinkComponentProps {
  title: string;
  subtitle: string;
  icon: Icon;
}
function FeatureCardLink({
  title,
  subtitle,
  icon: Icon,
  ...props
}: FeatureCardLinkProps) {
  return (
    <Link className={css({ display: "block", h: "full" })} {...props}>
      <CardTool
        className={featureCard}
        icon={<Icon />}
        title={title}
        description={subtitle}
        interactive
      />
    </Link>
  );
}

const homeViewport = css({
  display: "flex",
  flexDirection: "column",
  minH: "full",
  width: "full",
  pt: { base: "6", xl: "16" },
});

// [extrapolado] ReadingColumn (rule A, sizes.content.max = 1824px) is now
// the single gutter+cap source for this screen: homeViewport no longer
// carries its own `px`, and homeContent/builtBy no longer carry their own
// `maxWidth`/`mx`, so gutter and cap are not double-applied. This widens
// the content from the old 1024px (`maxWidth: "5xl"`) up to 1824px at
// >=1920 - needs design review. `homeRows` is the flex item that actually
// grows to fill homeViewport's remaining height (ReadingColumn's own outer
// gutter node can't take extra classes per RSP-04b), and its `1fr auto`
// grid rows push the BuiltBy row to the bottom exactly like the old
// `mt: auto` did, without needing ReadingColumn to stretch itself.
const homeRows = css({
  flex: "1",
  display: "grid",
  gridTemplateRows: "1fr auto",
  gap: "6",
});

const homeContent = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
});

const featureGrid = css({
  width: "full",
  gridAutoRows: "fr",
  gridTemplateColumns: {
    base: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
    // [extrapolado] with the cap widened to 1824px, staying at 2 columns
    // would stretch each card to ~900px at 2560 - worse reading than
    // today's ~500px. 4 columns keeps cards at a comparable width
    // (~438px at >=1920) instead.
    desktop: "repeat(4, minmax(0, 1fr))",
  },
});

const builtBy = css({
  display: "flex",
  justifyContent: "center",
  pt: "16",
  pb: "8",
});

export const Route = createFileRoute("/home/features")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation([
    "common",
    "dataset",
    "anonymizer",
    "voice-to-text",
  ]);

  return (
    <APIProtected>
      <Stack width="full" height="[100dvh]" gap="0">
        <Header />
        <MainContent full>
          <div className={homeViewport}>
            <div className={homeRows}>
              <ReadingColumn variant="full" className={homeContent}>
                <styled.h1 textStyle="title.md.strong">
                  {t("home.features.greeting")}
                </styled.h1>
                <Grid gap="6" className={featureGrid}>
                  <FeatureCardLink
                    to="/app/$feature"
                    params={{ feature: FeatureFlowEnum.Dataset }}
                    title={t("dataset:title")}
                    subtitle={t("dataset:subtitle")}
                    icon={FEATURE_ICON.DATA_SET}
                  />
                  <FeatureCardLink
                    to="/app/$feature"
                    params={{ feature: FeatureFlowEnum.Anonymizer }}
                    title={t("anonymizer:title")}
                    subtitle={t("anonymizer:subtitle")}
                    icon={FEATURE_ICON.ANONYMIZER}
                  />
                  <FeatureCardLink
                    to="/app/$feature"
                    params={{ feature: FeatureFlowEnum.VoiceToText }}
                    title={t("voice-to-text:title")}
                    subtitle={t("voice-to-text:subtitle")}
                    icon={FEATURE_ICON.VOICE_TO_TEXT}
                  />
                  <FeatureCardLink
                    to="/app/$feature"
                    params={{ feature: FeatureFlowEnum.Summarizer }}
                    title={t("home.features.summaryTitle")}
                    subtitle={t("home.features.summarySubtitle")}
                    icon={FEATURE_ICON.SUMMARIZER}
                  />
                </Grid>
              </ReadingColumn>
              <ReadingColumn variant="full" className={builtBy}>
                <BuiltBy />
              </ReadingColumn>
            </div>
          </div>
        </MainContent>
      </Stack>
    </APIProtected>
  );
}
