import { useState } from "react";

import { sva } from "@/styled/css";
import { HStack } from "@/styled/jsx";
import { stack } from "@/styled/patterns";
import Section from "./section";
import LabelManagerTab from "./tab";

const styles = sva({
  slots: ["container", "body"],
  base: {
    container: {
      ...stack.raw({ gap: "11" }),
      px: "8",
      pt: "6",
      pb: "0",
      width: "[400px]",

      bg: "bg.primary",
    },
    body: {},
  },
});

interface LabelManagerProps {
  onClose: () => void;
}
export default function LabelManager({ onClose }: LabelManagerProps) {
  const [selectedTab, setSelectedTab] = useState<"entity" | "config">("entity");

  const classes = styles();

  return (
    <div className={classes.container}>
      <HStack justify="space-between" alignItems="flex-start">
        <HStack alignItems="center">
          <LabelManagerTab
            isSelected={selectedTab === "entity"}
            onClick={() => setSelectedTab("entity")}
          >
            Entidades
          </LabelManagerTab>
          <LabelManagerTab
            isSelected={selectedTab === "config"}
            onClick={() => setSelectedTab("config")}
          >
            Configuracion
          </LabelManagerTab>
        </HStack>
        <button onClick={onClose} type="button">
          X
        </button>
      </HStack>
      <div className={classes.body}>
        <Section title="Categorias incluidas">
          <div />
        </Section>
      </div>
    </div>
  );
}
