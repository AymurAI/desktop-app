import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { Grid, Stack, styled } from "@/styled/jsx";
import { hstack, stack } from "@/styled/patterns";
import { FeatureFlowEnum } from "@/types/features";

const card = css({
  ...hstack.raw({ gap: "4", alignItems: "center" }),

  bg: "bg.secondary",
  border: "primary",
  rounded: "sm",

  px: "4",
  py: "6",
});

const stepStyle = css({
  ...stack.raw({ align: "center", justify: "center" }),

  bg: "action.alt-default",
  color: "text.onbutton-alternative",
  rounded: "full",
  textStyle: "cta.md.strong",

  width: "9",
  height: "9",
});

interface CardProps {
  img: string;
  imgAlt: string;
  step: number;
  title: string;
  subtitle: string;
}
function Card({ img, imgAlt, step, title, subtitle }: CardProps) {
  return (
    <div className={card}>
      <img src={img} alt={imgAlt} height="130" />
      <Stack gap="4">
        <p className={stepStyle}>{step}</p>
        <Stack>
          <styled.h2 textStyle="paragraph.sm.strong">{title}</styled.h2>
          <styled.p textStyle="subtitle.sm.default">{subtitle}</styled.p>
        </Stack>
      </Stack>
    </div>
  );
}

interface HowItWorksProps {
  title?: React.ReactNode;
  feature: FeatureFlowEnum;
}
export default function HowItWorks({
  title = "¿Cómo funciona?",
  feature,
}: HowItWorksProps) {
  const renderTitle =
    typeof title === "string" ? <SectionTitle>{title}</SectionTitle> : title;

  return (
    <Stack gap="6">
      {renderTitle}
      <Grid columns={2}>
        <Card
          img="/onboarding-steps/step1.png"
          imgAlt="Interfaz web con selector y cursor"
          title="Selecciona las resoluciones judiciales"
          subtitle="Sube los documentos que querés incorporar al set de datos."
          step={1}
        />
        <Card
          img="/onboarding-steps/step2.png"
          imgAlt="Barra de búsqueda con cursor"
          title="La inteligencia artificial analiza los documentos"
          subtitle="Extrae automáticamente la información relevante de cada documento."
          step={2}
        />
        <Card
          img="/onboarding-steps/step3.png"
          imgAlt="Visor de documentos con controles de revisión"
          title="Revisión y validación humana"
          subtitle="Es importante que verifiques que los datos sean correctos antes de exportar el archivo"
          step={3}
        />
        {/* Last step depends on the feature we're seeing */}
        {feature === FeatureFlowEnum.Dataset ? (
          <Card
            img="/onboarding-steps/step4.png"
            imgAlt="Binoculares con globo terráqueo"
            title="Generación del set de datos"
            subtitle="Los documentos pasan a formar parte del set de datos abiertos."
            step={4}
          />
        ) : (
          <Card
            img="/onboarding-steps/step4.png"
            imgAlt="Binoculares con globo terráqueo"
            title="Generación del documento anonimizado"
            subtitle="Proceso terminado. El documento esta listo para ser exportado."
            step={4}
          />
        )}
      </Grid>
    </Stack>
  );
}
