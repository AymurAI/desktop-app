import { css } from "@/styled/css";
import { Stack } from "@/styled/jsx";
import nArray from "@/utils/nArray";
import { Plus, X } from "phosphor-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { Tab, TabName } from "../tabs";

const button = css({
  cursor: "pointer",
  p: "2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  height: "full",
  width: "12",
});

const removeControl = css({
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: "1",
  rounded: "full",
  "&:hover": {
    bg: "[rgba(255,255,255,0.15)]",
  },
});

interface Props {
  selected: number;
  decisionAmount: number;
  addDecision: () => void;
  selectDecision: (n: number) => void;
  /** Tab label prefix. Defaults to "Decisión" (Set de Datos wording). */
  label?: string;
  /** When provided and there is more than one tab, renders a remove control per tab. */
  onRemove?: (n: number) => void;
}
export default function DecisionTabs({
  selected,
  decisionAmount,
  addDecision,
  selectDecision,
  label = "Decisión",
  onRemove,
}: Props) {
  const decisionArr = nArray(decisionAmount, undefined).map((_, i) => i);

  const selectDecisionHandler = (n: number) => () => selectDecision(n);
  const showRemove = !!onRemove && decisionAmount > 1;

  const removeHandler =
    (n: number) => (event: ReactMouseEvent | ReactKeyboardEvent) => {
      event.stopPropagation();
      onRemove?.(n);
    };

  return (
    <Stack direction="row" gap="2">
      {decisionArr.map((dec) => (
        <Tab
          key={dec}
          as="button"
          css={{ cursor: "pointer" }}
          onClick={selectDecisionHandler(dec)}
          status={selected === dec ? "focus" : "default"}
        >
          <TabName css={{ cursor: "pointer" }}>
            {label} {dec + 1}
          </TabName>
          {showRemove && (
            // A real <button> here would nest inside the button-rendered Tab
            // (invalid HTML — the browser would hoist it out and break
            // stopPropagation), so this uses a role="button" span instead.
            // biome-ignore lint/a11y/useSemanticElements: see comment above
            <span
              role="button"
              tabIndex={0}
              aria-label={`Eliminar ${label} ${dec + 1}`}
              onClick={removeHandler(dec)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  removeHandler(dec)(event);
                }
              }}
              className={removeControl}
            >
              <X size={12} weight="bold" />
            </span>
          )}
        </Tab>
      ))}
      <button onClick={addDecision} className={button} type="button">
        <Plus size={16} weight="light" />
      </button>
    </Stack>
  );
}
