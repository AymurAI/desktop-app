import CardTool from "@/components/home/card-tool";
import { css } from "@/styled/css";
import { Grid, Stack, styled } from "@/styled/jsx";
import { Feature } from "@/types/features";
import { createFileRoute } from "@tanstack/react-router";
import { Database, Detective } from "phosphor-react";

export const Route = createFileRoute("/home/features")({
  component: RouteComponent,
});

const header = css({
  width: "full",
  py: "6",
  px: "8",
  bg: "bg.secondary",
  borderBottom: "[1px solid #BCBAB8]",
});
const content = css({
  display: "flex",
  justifyContent: "center",
  flex: "1",

  width: "full",
  height: "full",
  pt: "28",

  bg: "bg.primary",
});

function RouteComponent() {
  return (
    <Stack width="screen" height="screen" gap="0">
      <div className={header}>
        <img
          width={200}
          src="brand/aymurai-hor-darkpurple.svg"
          alt="AymurAI logo"
        />
      </div>
      <main className={content}>
        <Stack gap="6" width="5xl" mx="8">
          <styled.h1 textStyle="title.md.strong">
            ¡Hola! Selecciona la herramienta a utilizar
          </styled.h1>
          <Grid columns={2}>
            <CardTool
              to="/app/$feature"
              params={{ feature: Feature.Dataset }}
              icon={Database}
              title="Set de Datos"
              subtitle="Convertí resoluciones judiciales en set de datos estructurados"
            />
            <CardTool
              to="/app/$feature"
              params={{ feature: Feature.Dataset }}
              icon={Detective}
              title="Anonimizador"
              subtitle="Anonimiza resoluciones judiciales de manera automática y editable"
            />
          </Grid>
        </Stack>
      </main>
    </Stack>
  );
}
