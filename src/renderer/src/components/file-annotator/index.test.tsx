import type { DocFile } from "@/types/file";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FileAnnotator from ".";

// Panda class names are space-separated atomic tokens; `toContain` on the
// className STRING is a substring test (e.g. "panel.side" also matches
// "panel.sideCompact"), so every check here matches a WHOLE class token via
// the split class list, same convention as side-panel-column.test.tsx.
function classTokens(el: Element) {
  return el.className.split(/\s+/);
}

const file: DocFile = {
  data: new File(["hola"], "documento.docx"),
  paragraphs: [{ id: "p1", document_id: "doc-1", value: "Hola mundo" }],
  selected: true,
  validationObject: {},
};

describe("FileAnnotator entities panel (RSP-07a)", () => {
  it("renders the panel through SidePanelColumn, not the old clamp(260px,32vw,400px) div", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const panel = screen.getByTestId("anon-side-panel");
    const classes = classTokens(panel);

    // SidePanelColumn's own recipe classes (side-panel-column.test.tsx
    // asserts these exhaustively) - their presence here is what proves the
    // wrapper div was actually swapped for the primitive.
    expect(classes).toContain("max-w_panel.side");
    expect(classes).toContain("flex-sh_0");
    expect(classes).toContain("bd-l_[1px_solid_#BCBAB8]");
    expect(classes).toContain("lg:w_panel.sideCompact");
    expect(classes).toContain("desktop:w_panel.side");

    // The old self-imposed width is gone from the tree entirely.
    const html = panel.outerHTML;
    expect(html).not.toContain("clamp(260px");
    expect(html).not.toContain("45vw");
  });

  it("gives the pane HStack position:relative as SidePanelColumn's overlay containing block", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const panel = screen.getByTestId("anon-side-panel");
    const pane = panel.parentElement as HTMLElement;

    expect(classTokens(pane)).toContain("pos_relative");
  });

  it("keeps LabelManager's own container filling the panel (width: full) instead of imposing its own width", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const panel = screen.getByTestId("anon-side-panel");
    const labelManagerRoot = panel.querySelector(":scope > div") as HTMLElement;

    expect(labelManagerRoot).toBeTruthy();
    expect(classTokens(labelManagerRoot)).toContain("w_full");
  });

  it("still toggles hidden on the same testid'd node when closed", () => {
    render(<FileAnnotator file={file} isAnnotable={false} />);

    const panel = screen.getByTestId("anon-side-panel");
    expect(panel).toHaveAttribute("hidden");
  });
});

describe("FileAnnotator document column (RSP-07b)", () => {
  it("renders ReadingColumn variant=doc (rule C) when the panel starts open", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const column = screen.getByTestId("anon-reading-column");
    const classes = classTokens(column);

    expect(classes).toContain("w_[min(88%,_token(sizes.content.doc))]");
    // `doc` sets no max-width - it must not carry rule A/B's cap classes.
    expect(classes).not.toContain("max-w_content.max");
    expect(classes).not.toContain("max-w_content.split");
  });

  it("renders ReadingColumn variant=full (rule A) when the panel starts closed", () => {
    render(<FileAnnotator file={file} isAnnotable={false} />);

    const column = screen.getByTestId("anon-reading-column");
    expect(classTokens(column)).toContain("max-w_content.max");
  });

  it("nests the reading column inside the scroll container instead of replacing it", () => {
    // isAnnotable (panel open) -> variant="doc", a SINGLE element, so
    // `column.parentElement` is `S.file` directly - unlike full/split's
    // two-node shape (T17), which would insert a gutter div in between.
    render(<FileAnnotator file={file} isAnnotable />);

    const column = screen.getByTestId("anon-reading-column");
    const scrollContainer = column.parentElement as HTMLElement;

    // S.file - the scroll container and keyboard-focus target - must still
    // own overflow/flex/tabIndex; ReadingColumn nests INSIDE it, it isn't
    // replaced by it.
    expect(scrollContainer).toHaveAttribute("tabIndex", "-1");
    const scrollClasses = classTokens(scrollContainer);
    expect(scrollClasses).toContain("ov-y_auto");
    expect(scrollClasses).toContain("flex_1");
    expect(scrollClasses).toContain("min-h_0");
    expect(scrollClasses).toContain("min-w_0");
    // Confirms the horizontal gutter/cap moved OFF this host node.
    expect(scrollClasses).not.toContain("px_8");
  });

  it("keeps the document font-size rule scoped under the scroll container", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const column = screen.getByTestId("anon-reading-column");
    const scrollContainer = column.parentElement as HTMLElement;

    expect(scrollContainer.className).toContain("fs_[16px]");
  });

  it("adds the 520px minWidth guardrail to the pane container", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const column = screen.getByTestId("anon-reading-column");
    // container is the ancestor two levels up: S.file > S.container.
    const container = column.parentElement?.parentElement as HTMLElement;

    expect(classTokens(container)).toContain("min-w_[520px]");
  });
});

// Every other test in this file renders ONE fixed initial state; none of them
// crosses the panel toggle, which is the only path that changes
// ReadingColumn's variant at runtime (`narrowDocument || labelManagerOpen ?
// "doc" : "full"`). Because `doc` renders one element and `full` renders two
// nested ones, that toggle changes the element type at the document's position
// and React unmounts the whole document instead of restyling it - see
// layout/reading-column.test.tsx's "variant transitions preserve the subtree".
describe("FileAnnotator panel toggle (adversary: RSP-07b variant remount)", () => {
  it("restyles the document instead of destroying and rebuilding it when the entities panel is closed", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    const paragraphBefore = document.getElementById("p1");
    expect(paragraphBefore).not.toBeNull();

    // LabelManager's own close button - the only way to close the panel once
    // it is open (SearchBar renders "Gestor de etiquetas" only while closed).
    fireEvent.click(screen.getByRole("button", { name: "X" }));

    // Guard against a vacuous pass: the toggle really happened.
    expect(screen.getByTestId("anon-side-panel")).toHaveAttribute("hidden");
    expect(classTokens(screen.getByTestId("anon-reading-column"))).toContain(
      "max-w_content.max",
    );

    // The document's DOM must survive a width change. Identity, not equality:
    // a rebuilt paragraph serialises identically but has thrown away every
    // memoised Paragraph, the live text selection an annotation is made from,
    // any open annotation popover, and AnnotationProvider's state.
    expect(document.getElementById("p1")).toBe(paragraphBefore);
  });

  it("restyles the document instead of destroying and rebuilding it when the entities panel is reopened", () => {
    render(<FileAnnotator file={file} isAnnotable />);

    // The panel starts open here, so reach the closed state first - only then
    // does SearchBar offer the "Gestor de etiquetas" reopen button.
    fireEvent.click(screen.getByRole("button", { name: "X" }));

    const paragraphBefore = document.getElementById("p1");
    expect(paragraphBefore).not.toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /gestor de etiquetas/i }),
    );

    expect(screen.getByTestId("anon-side-panel")).not.toHaveAttribute("hidden");
    expect(document.getElementById("p1")).toBe(paragraphBefore);
  });
});

describe("FileAnnotator narrowDocument opt-in (RSP-08)", () => {
  it("forces variant=doc (rule C) even with the panel closed, when narrowDocument is set", () => {
    render(<FileAnnotator file={file} isAnnotable={false} narrowDocument />);

    const column = screen.getByTestId("anon-reading-column");
    const classes = classTokens(column);

    expect(classes).toContain("w_[min(88%,_token(sizes.content.doc))]");
    expect(classes).not.toContain("max-w_content.max");
  });

  it("defaults to today's behavior (variant=full when the panel starts closed) when narrowDocument is omitted", () => {
    render(<FileAnnotator file={file} isAnnotable={false} />);

    const column = screen.getByTestId("anon-reading-column");
    expect(classTokens(column)).toContain("max-w_content.max");
  });
});
