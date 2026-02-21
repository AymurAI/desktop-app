import { Button } from "@/components";
import { useRunLocalServer } from "@/services/aymurai";
import { css } from "@/styled/css";
import { stack } from "@/styled/patterns";
import { useNavigate } from "@tanstack/react-router";
import { HardDrives, Monitor } from "phosphor-react";

interface ChooseHostProps {
  onRemoteClick: () => void;
}
export default function ChooseHost({ onRemoteClick }: ChooseHostProps) {
  const navigate = useNavigate();
  const { run: runLocalServer, isRunning } = useRunLocalServer({
    onSuccess: () =>
      navigate({
        to: "/home/features",
      }),
  });

  return (
    <div className={stack({ align: "center", gap: "12", width: "[400px]" })}>
      <img
        src="/brand/aymurai-vert-darkpurple.svg"
        alt="Logotipo AymurAI"
        width={180}
      />
      <div className={stack({ align: "stretch", gap: "4", width: "full" })}>
        <h2
          className={css({
            textStyle: "subtitle.sm.strong",
            textAlign: "center",
          })}
        >
          ¿Como deseas conectarte a Aymurai?
        </h2>
        <div className={stack({ gap: "2", align: "center" })}>
          <Button
            onClick={runLocalServer}
            disabled={isRunning}
            isLoading={isRunning}
          >
            <Monitor weight="bold" />
            Local
          </Button>
          <p className={css({ textStyle: "subtitle.sm.default" })} aria-hidden>
            o
          </p>
          <Button onClick={onRemoteClick}>
            <HardDrives weight="bold" />
            Servidor
          </Button>
        </div>
      </div>
    </div>
  );
}
