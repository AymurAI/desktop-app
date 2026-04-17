import { FeatureCard, Subtitle } from "@/components";
import { styled } from "@/styles/stitches.config";
import { Feature } from "@/types/features";
import { Database, Detective, FileAudio, FileDoc, TextAlignLeft } from "phosphor-react";
import { useNavigate } from "react-router-dom";

const PageWrapper = styled("div", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "$l",
});

const CardGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "repeat(3, 320px)",
  gap: "$l",
});

export function Features() {
  const navigate = useNavigate();

  const handleSelectFeature = (feature: Feature) => () => {
    navigate(`/app/${feature}/onboarding`);
  };

  return (
    <PageWrapper>
      <Subtitle
        weight="strong"
        css={{ fontSize: 24, textAlign: "center" }}
      >
        ¡Hola! Selecciona la herramienta a utilizar
      </Subtitle>

      <CardGrid>
        <FeatureCard
          icon={<Database size={24} weight="bold" />}
          title="Set de Datos"
          description="Convierte documentos en una base de datos estructurada"
          onClick={handleSelectFeature(Feature.Dataset)}
        />
        <FeatureCard
          icon={<Detective size={24} weight="bold" />}
          title="Anonimizador"
          description="Anonimiza resoluciones judiciales de manera automática y editable"
          onClick={handleSelectFeature(Feature.Anonymizer)}
        />
        <FeatureCard
          icon={<FileAudio size={24} weight="bold" />}
          title="Voz a Texto"
          description="Transcribe audios a documento de texto editables"
          onClick={handleSelectFeature(Feature.VoiceToText)}
        />
        <FeatureCard
          icon={<TextAlignLeft size={24} weight="bold" />}
          title="Resumen de documento"
          description="Resumen automático de documentos"
          disabled={true}
        />
        <FeatureCard
          icon={<FileDoc size={24} weight="bold" />}
          title="PDF a Word"
          description="Transforma archivos .pdf a .docx"
          disabled={true}
        />
      </CardGrid>
    </PageWrapper>
  );
}
