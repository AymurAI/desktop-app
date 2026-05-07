import {
  type Dispatch,
  type ReactNode,
  createContext,
  useEffect,
  useReducer,
  useState,
} from "react";

import reducer, { type Action } from "@/reducers/file";
import { restoreCheckpoint } from "@/reducers/file/actions";
import { useCheckpoint } from "@/hooks/useCheckpoint";
import type { CheckpointData } from "@/services/checkpoint";
import type { DocFile } from "@/types/file";
import Button from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Context used to provide files that have to be processed
 */
export const FileContext = createContext<DocFile[]>([]);
FileContext.displayName = "FileContext";

/**
 * Context used to provide the dispatch function
 */
export const FileDispatchContext = createContext<Dispatch<Action>>(() => {});
FileDispatchContext.displayName = "FileDispatchContext";

interface Props {
  children: ReactNode;
}
export default function FileProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, []);
  const { loadAllCheckpoints, clearCheckpoint } = useCheckpoint();
  const [pendingCheckpoints, setPendingCheckpoints] = useState<Record<
    string,
    CheckpointData
  > | null>(null);

  useEffect(() => {
    const all = loadAllCheckpoints();
    if (Object.keys(all).length > 0) {
      setPendingCheckpoints(all);
    }
  }, [loadAllCheckpoints]);

  const handleAccept = () => {
    if (!pendingCheckpoints) return;
    for (const [fileName, data] of Object.entries(pendingCheckpoints)) {
      dispatch(
        restoreCheckpoint(
          fileName,
          data.predictions,
          data.validationObject,
          data.validated,
        ),
      );
    }
    setPendingCheckpoints(null);
  };

  const handleDecline = () => {
    if (!pendingCheckpoints) return;
    for (const fileName of Object.keys(pendingCheckpoints)) {
      clearCheckpoint(fileName);
    }
    setPendingCheckpoints(null);
  };

  return (
    <FileContext.Provider value={state}>
      <FileDispatchContext.Provider value={dispatch}>
        {children}
        <Dialog
          open={pendingCheckpoints !== null}
          onOpenChange={(open) => {
            if (!open) handleDecline();
          }}
        >
          <DialogContent>
            <DialogTitle>Trabajo previo encontrado</DialogTitle>
            <p>
              Se encontró trabajo previo sin guardar. ¿Deseas recuperarlo?
            </p>
            <DialogFooter>
              <Button onClick={handleAccept}>Recuperar</Button>
              <Button onClick={handleDecline}>Descartar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FileDispatchContext.Provider>
    </FileContext.Provider>
  );
}
