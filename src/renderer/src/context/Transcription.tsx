import {
  type Dispatch,
  type ReactNode,
  createContext,
  useReducer,
} from "react";

import reducer, { type TranscriptionAction } from "@/reducers/transcription";
import type { Transcription } from "@/types/transcription";

/**
 * Context used to provide transcriptions in the state
 */
export const TranscriptionContext = createContext<Transcription[]>([]);
TranscriptionContext.displayName = "TranscriptionContext";

/**
 * Context used to provide the dispatch function
 */
export const TranscriptionDispatchContext = createContext<Dispatch<TranscriptionAction>>(
  () => {},
);
TranscriptionDispatchContext.displayName = "TranscriptionDispatchContext";

interface Props {
  children: ReactNode;
}
export default function TranscriptionProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, []);

  return (
    <TranscriptionContext.Provider value={state}>
      <TranscriptionDispatchContext.Provider value={dispatch}>
        {children}
      </TranscriptionDispatchContext.Provider>
    </TranscriptionContext.Provider>
  );
}
