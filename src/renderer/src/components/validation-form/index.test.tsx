import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ValidationForm from ".";

// Panda class names are space-separated atomic tokens; match whole tokens
// rather than substrings (same convention as stack/index.test.tsx and
// file-check/index.test.tsx).
function classTokens(el: Element) {
  return el.className.split(/\s+/);
}

describe("ValidationForm (RSP-08f)", () => {
  it("keeps the flex column layout and 24px gap inlined from ValidationForm.styles.ts", () => {
    render(
      <ValidationForm title="Título" onSubmit={vi.fn()} onCheck={vi.fn()}>
        <input />
      </ValidationForm>,
    );

    const form = screen.getByText("Título").closest("form");
    expect(form).not.toBeNull();
    const classes = classTokens(form as Element);

    expect(classes).toContain("d_flex");
    expect(classes).toContain("flex-d_column");
    expect(classes).toContain("gap_6");
  });

  it("renders the title and the submit/check affordance", () => {
    render(
      <ValidationForm title="Título" onSubmit={vi.fn()} onCheck={vi.fn()}>
        <input />
      </ValidationForm>,
    );

    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Datos correctos/ }),
    ).toBeInTheDocument();
  });
});
