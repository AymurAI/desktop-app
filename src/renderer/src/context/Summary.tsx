import { createContext, useContext, useReducer } from "react";

// TODO(ui-components): replace with
// `import { documentFromPlainText, type RichTextDocument, type RichTextParagraph, type TextRun, type TextMark } from "@aymurai/ui"`
// once the RichTextEditor plan (docs/superpowers/plans/2026-07-22-rich-text-editor.md
// in the ui-components repo) has landed — identical shape, drop-in swap.
export type MarkType = "bold" | "italic" | "underline" | "highlight";

export interface TextMark {
  type: MarkType;
  color?: string;
}

export interface TextRun {
  text: string;
  marks: TextMark[];
}

export interface RichTextParagraph {
  id: string;
  runs: TextRun[];
}

export interface RichTextDocument {
  paragraphs: RichTextParagraph[];
}

function documentFromPlainText(text: string): RichTextDocument {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return {
    paragraphs: blocks.map((block, index) => ({
      id: `p${index}`,
      runs: [{ text: block, marks: [] }],
    })),
  };
}

export type SummaryStatus =
  | "idle"
  | "streaming"
  | "completed"
  | "error"
  | "stopped";

export interface SummaryState {
  status: SummaryStatus;
  sourceFileName: string | null;
  title: string;
  partialText: string;
  document: RichTextDocument | null;
  error: string | null;
}

const initialState: SummaryState = {
  status: "idle",
  sourceFileName: null,
  title: "",
  partialText: "",
  document: null,
  error: null,
};

export type SummaryAction =
  | { type: "reset" }
  | { type: "start"; fileName: string }
  | { type: "setPartialText"; text: string }
  | { type: "finish"; summary: string }
  | { type: "error"; message: string }
  | { type: "stop" }
  | { type: "edit"; document: RichTextDocument }
  | { type: "editTitle"; title: string };

export const reset = (): SummaryAction => ({ type: "reset" });
export const start = (fileName: string): SummaryAction => ({
  type: "start",
  fileName,
});
export const setPartialText = (text: string): SummaryAction => ({
  type: "setPartialText",
  text,
});
export const finish = (summary: string): SummaryAction => ({
  type: "finish",
  summary,
});
export const error = (message: string): SummaryAction => ({
  type: "error",
  message,
});
export const stop = (): SummaryAction => ({ type: "stop" });
export const edit = (document: RichTextDocument): SummaryAction => ({
  type: "edit",
  document,
});
export const editTitle = (title: string): SummaryAction => ({
  type: "editTitle",
  title,
});

function summaryReducer(
  state: SummaryState,
  action: SummaryAction,
): SummaryState {
  switch (action.type) {
    case "reset":
      return initialState;
    case "start":
      return {
        ...initialState,
        status: "streaming",
        sourceFileName: action.fileName,
        title: `Resumen ${action.fileName}`,
      };
    case "setPartialText":
      return { ...state, partialText: action.text };
    case "finish":
      return {
        ...state,
        status: "completed",
        document: documentFromPlainText(action.summary),
      };
    case "error":
      return { ...state, status: "error", error: action.message };
    case "stop":
      return { ...state, status: "stopped" };
    case "edit":
      return { ...state, document: action.document };
    case "editTitle":
      return { ...state, title: action.title };
    default:
      return state;
  }
}

const SummaryContext = createContext<SummaryState>(initialState);
const SummaryDispatchContext = createContext<React.Dispatch<SummaryAction>>(
  () => {},
);

export default function SummaryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(summaryReducer, initialState);
  return (
    <SummaryContext.Provider value={state}>
      <SummaryDispatchContext.Provider value={dispatch}>
        {children}
      </SummaryDispatchContext.Provider>
    </SummaryContext.Provider>
  );
}

export function useSummary() {
  return useContext(SummaryContext);
}

export function useSummaryDispatch() {
  return useContext(SummaryDispatchContext);
}
