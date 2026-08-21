import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnonymizerLabelSelect, { select } from "./anonymizer-label-select";

describe("anonymizer-label-select recipe (RSP-07b)", () => {
  it("relaxes the dropdown viewport's cap so it can shrink on short viewports", () => {
    const classes = select().viewport;

    expect(classes).toContain("max-h_[min(360px,_60dvh)]");
    expect(classes).not.toContain("max-h_[360px]");
  });
});

const OPTIONS = [
  { id: "PERSONA", text: "Persona" },
  { id: "LOC", text: "Localidad" },
];

describe("anonymizer-label-select controlled value", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // `RadixSelect.Root` receives `value={value}` raw, so it is UNCONTROLLED
  // (`prop === undefined`) whenever no label is selected and CONTROLLED as
  // soon as one is - and every consumer feeds it exactly that: the toolbar
  // via `labelValue={label ?? undefined}` (file-annotator/index.tsx) into
  // `value={labelValue}` (SearchBar/index.tsx), plus tagger.tsx and
  // entity-tab.tsx. Radix keeps a separate uncontrolled value that it falls
  // back to the moment the prop goes undefined again, so the two states
  // diverge permanently after the first round trip.
  //
  // Reproduced end-to-end in Chromium against FileAnnotator: pick "Persona"
  // in the toolbar select, turn "Persona" off in the label manager's
  // "Configuración" tab (file-annotator/index.tsx's effect then resets
  // `label` to null), turn it back on, and pick "Persona" again - the
  // trigger stays on the "Etiqueta" placeholder and `label` stays null,
  // because Radix still holds "PERSONA" internally and treats the click as
  // a no-op change. The option is dead for the rest of the session while
  // every never-selected label ("Localidad") still works. The dropdown
  // even renders "Persona" as `data-state="checked"` while the app shows no
  // selection at all.
  //
  // jsdom performs no pointer/portal work for a Radix dropdown, so this
  // test pins the root cause instead of the click: the exact prop sequence
  // the app produces (no label -> label -> no label) must not flip Radix
  // between controlled and uncontrolled. Keep the prop defined for the
  // component's lifetime (e.g. `value={value ?? ""}`, which Radix treats as
  // "no value" for placeholder purposes) and the divergence cannot happen.
  it("never flips Radix between controlled and uncontrolled across the app's no-label -> label -> no-label sequence", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const view = (value?: string) => (
      <AnonymizerLabelSelect
        placeholder="Etiqueta"
        value={value}
        options={OPTIONS}
        onChange={() => {}}
      />
    );

    const { rerender } = render(view(undefined));
    expect(screen.getByRole("combobox")).toHaveTextContent("Etiqueta");

    // The user picks "Persona": FileAnnotator's `label` goes null -> "PERSONA".
    rerender(view("PERSONA"));
    expect(screen.getByRole("combobox")).toHaveTextContent("Persona");

    // "Persona" gets excluded in the label manager: `label` -> null again.
    rerender(view(undefined));
    expect(screen.getByRole("combobox")).toHaveTextContent("Etiqueta");

    expect(warn.mock.calls.map((call) => String(call[0]))).toEqual([]);
  });
});
