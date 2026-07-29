import type { Paragraph } from "@/types/file";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentSearchPanel from "./document-search-panel";

// jsdom doesn't implement scrollIntoView at all.
Element.prototype.scrollIntoView = vi.fn();

const paragraphs: Paragraph[] = [
  {
    id: "p0",
    document_id: "d0",
    value: "Primer párrafo con la palabra clave.",
  },
  { id: "p1", document_id: "d0", value: "Segundo párrafo, sin coincidencias." },
  {
    id: "p2",
    document_id: "d0",
    value: "Tercer párrafo repite la palabra clave otra vez.",
  },
];

describe("DocumentSearchPanel", () => {
  it("renders every paragraph's text", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    expect(screen.getByText(/Primer párrafo/)).toBeInTheDocument();
    expect(screen.getByText(/Segundo párrafo/)).toBeInTheDocument();
  });

  it("shows a match count once a query is typed", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "clave" },
    });
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });

  it("advances to the next match on 'Siguiente' and wraps around", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });

  it("shows no count for a query with zero matches", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inexistente" },
    });
    expect(screen.getByText("0 de 0")).toBeInTheDocument();
  });

  it("highlights every occurrence within a single paragraph and moves the active highlight on navigation", () => {
    const repeatedParagraphs: Paragraph[] = [
      { id: "p0", document_id: "d0", value: "clave uno clave dos clave tres" },
    ];
    const { container } = render(
      <DocumentSearchPanel paragraphs={repeatedParagraphs} />,
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "clave" },
    });

    const marks = () => Array.from(container.querySelectorAll("mark"));

    // all 3 occurrences within the single paragraph are highlighted
    expect(marks()).toHaveLength(3);
    expect(screen.getByText("1 de 3")).toBeInTheDocument();

    // exactly one mark carries the "active" class, and it's the first one
    const classesOf = () => marks().map((mark) => mark.className);
    expect(new Set(classesOf()).size).toBe(2); // 1 active class + 1 shared inactive class
    expect(marks()[0].className).not.toBe(marks()[1].className);
    expect(marks()[1].className).toBe(marks()[2].className);

    // advancing moves which occurrence is "active"
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    expect(marks()[1].className).not.toBe(marks()[0].className);
    expect(marks()[1].className).not.toBe(marks()[2].className);
    expect(marks()[0].className).toBe(marks()[2].className);

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    expect(marks()[2].className).not.toBe(marks()[0].className);
    expect(marks()[0].className).toBe(marks()[1].className);
  });

  it("scrolls the active match into view when the active match changes", () => {
    const scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView");
    render(<DocumentSearchPanel paragraphs={paragraphs} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "clave" },
    });
    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(scrollSpy).toHaveBeenCalledWith({ block: "center" });
  });
});

describe("DocumentSearchPanel reading column (RSP-09)", () => {
  it("renders the paragraphs through ReadingColumn variant=doc, a single element with no gutter", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);

    const column = screen.getByTestId("summary-search-reading-column");
    const classes = column.className.split(/\s+/);

    // rule C: percentage of the pane, capped by the content.doc token - no
    // separate cap node (unlike full/split, RSP-04b) and no gutter classes.
    expect(classes).toContain("w_[min(88%,_token(sizes.content.doc))]");
    expect(classes).toContain("mx_auto");
    expect(classes).not.toContain("px_4");
    expect(classes).not.toContain("max-w_content.max");
  });

  it("moves the horizontal gutter off the scroll container onto ReadingColumn", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);

    const column = screen.getByTestId("summary-search-reading-column");
    const scrollContainer = column.parentElement as HTMLElement;
    const scrollClasses = scrollContainer.className.split(/\s+/);

    expect(scrollClasses).not.toContain("px_8");
    // The scroll container itself is unchanged otherwise.
    expect(scrollClasses).toContain("ov-y_auto");
    expect(scrollClasses).toContain("pb_8");
  });
});
