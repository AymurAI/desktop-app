import { Button, Stack, Subtitle } from "@/components";
import { useLogin } from "@/hooks";
import { FunctionType } from "@/types/user";
import { ArrowBendUpLeft, Database, Detective } from "phosphor-react";
import { useNavigate } from "react-router-dom";

export function Features() {
  const navigate = useNavigate();
  const { login } = useLogin();

  const handleBack = () => {
    navigate("/login");
  };

  const handleSelectFeature = (feature: FunctionType) => {
    login.offline(feature);
    navigate("/onboarding");
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
      <Button onClick={() => handleSelectFeature(FunctionType.DATASET)}>
        <Database weight="bold" />
        Set de datos
      </Button>
      <Subtitle size="s" css={{ textAlign: "center" }}>
        o
      </Subtitle>
      <Button onClick={() => handleSelectFeature(FunctionType.ANONYMIZER)}>
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
