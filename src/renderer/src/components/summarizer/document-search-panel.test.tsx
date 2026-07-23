import type { Paragraph } from "@/types/file";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocumentSearchPanel from "./document-search-panel";

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
});
