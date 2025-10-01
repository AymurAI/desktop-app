import { Button, Stack, Subtitle } from "@/components";
import { Feature } from "@/types/features";
import { ArrowBendUpLeft, Database, Detective } from "phosphor-react";
import { useNavigate } from "react-router-dom";

export function Features() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/login");
  };

  const handleSelectFeature = (feature: Feature) => () => {
    navigate(`/app/${feature}/onboarding`);
  };

  return (
    <Stack
      direction="column"
      spacing="m"
      align="stretch"
      css={{ width: 400, minHeight: "240px" }}
    >
      <Subtitle weight="strong" size="s" css={{ textAlign: "center" }}>
        ¿Cual función vas a utilizar?
      </Subtitle>
      <Button onClick={handleSelectFeature(Feature.Dataset)}>
        <Database weight="bold" />
        Set de datos
      </Button>
      <Subtitle size="s" css={{ textAlign: "center" }}>
        o
      </Subtitle>
      <Button onClick={handleSelectFeature(Feature.Anonymizer)}>
        <Detective weight="bold" />
        Anonimizador
      </Button>
      <Button variant={"secondary"} onClick={handleBack}>
        <ArrowBendUpLeft weight="bold" />
        Volver al inicio
      </Button>
    </Stack>
  );
}
