import BuiltBy from "@/components/brand/built-by";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
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
  px: { base: "4", sm: "6", md: "8" },
  pt: { base: "6", xl: "16" },
});

const homeContent = css({
  display: "flex",
  flexDirection: "column",
  flex: "1",
  width: "full",
  maxWidth: "5xl",
  mx: "auto",
  gap: "6",
});

const featureGrid = css({
  width: "full",
  gridAutoRows: "fr",
  gridTemplateColumns: {
    base: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
  },
});

const builtBy = css({
  display: "flex",
  justifyContent: "center",
  mt: "auto",
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
    "recomendaciones",
    "summarizer",
  ]);

  return (
    <APIProtected>
      <Stack width="screen" height="screen" gap="0">
        <Header />
        <MainContent full>
          <div className={homeViewport}>
            <div className={homeContent}>
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
                  params={{ feature: FeatureFlowEnum.Recomendaciones }}
                  title={t("recomendaciones:title")}
                  subtitle={t("recomendaciones:subtitle")}
                  icon={FEATURE_ICON.RECOMENDACIONES}
                />
                <FeatureCardLink
                  to="/app/$feature"
                  params={{ feature: FeatureFlowEnum.Summarizer }}
                  title={t("summarizer:title")}
                  subtitle={t("summarizer:subtitle")}
                  icon={FEATURE_ICON.SUMMARIZER}
                />
              </Grid>
              <div className={builtBy}>
                <BuiltBy />
              </div>
            </div>
          </div>
        </MainContent>
      </Stack>
    </APIProtected>
  );
}
