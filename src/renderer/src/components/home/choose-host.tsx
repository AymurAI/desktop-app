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
        src="brand/aymurai-vert-darkpurple.png"
        alt="Logotipo AymurAI"
        width={180}
        //  TODO: should get fixed with image changes
        style={{ margin: -48 }}
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
  // return (
  //   <Stack direction="column" align="center" style={{ gap: 48 }}>
  //         <img
  //           src="brand/aymurai-vert-darkpurple.png"
  //           alt="Logotipo AymurAI"
  //           width={180}
  //           style={{ margin: -48 }}
  //         />
  //         <Stack direction="column" spacing="m" align="center">
  //           <Subtitle size="s" weight="strong" as="h1">
  //             ¿Como deseas conectarte a Aymurai?
  //           </Subtitle>
  //           <Stack
  //             spacing="s"
  //             direction="column"
  //             align="center"
  //             style={{ width: 400 }}
  //           >
  //             <Button
  //               onClick={handleUseLocal}
  //               disabled={isRunning}
  //               isLoading={isRunning}
  //             >
  //               <Monitor weight="bold" />
  //               Local
  //             </Button>
  //             <Subtitle size="s" aria-hidden>
  //               o
  //             </Subtitle>
  //             <Button onClick={handleUseRemote}>
  //               <HardDrives weight="bold" />
  //               Servidor
  //             </Button>
  //           </Stack>
  //         </Stack>
  //       </Stack>
  // )
}
