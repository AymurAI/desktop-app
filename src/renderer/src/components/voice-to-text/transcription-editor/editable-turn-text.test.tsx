import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTurnText } from "./editable-turn-text";

function renderText(
  overrides: Partial<React.ComponentProps<typeof EditableTurnText>> = {},
) {
  const onCommit = vi.fn();
  const onSelect = vi.fn();
  render(
    <EditableTurnText
      turnId="t1"
      text="hola mundo"
      ariaLabel="x"
      onCommit={onCommit}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onCommit, onSelect };
}

describe("EditableTurnText search highlighting", () => {
  it("wraps a matching substring in <mark>, case-insensitively", () => {
    renderText({ highlight: "MUNDO" });
    expect(screen.getByRole("textbox").innerHTML).toBe(
      "hola <mark>mundo</mark>",
    );
  });

  it("renders plain escaped text when there is no highlight query", () => {
    renderText();
    expect(screen.getByRole("textbox").innerHTML).toBe("hola mundo");
  });

  it("commits clean plain text on blur even when the last paint was highlighted", () => {
    const { onCommit } = renderText({ highlight: "mundo" });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onCommit).toHaveBeenCalledWith("t1", "hola mundo");
  });

  it("does not overwrite in-progress typing when props change while focused", () => {
    function Wrapper({
      text,
      highlight,
    }: {
      text: string;
      highlight?: string;
    }) {
      return (
        <EditableTurnText
          turnId="t1"
          text={text}
          highlight={highlight}
          ariaLabel="x"
          onCommit={vi.fn()}
          onSelect={vi.fn()}
        />
      );
    }

    const { rerender } = render(
      <Wrapper text="hola mundo" highlight="mundo" />,
    );
    const el = screen.getByRole("textbox");
    fireEvent.focus(el);
    el.textContent = "hola mundo nuevo"; // simulates the user typing
    rerender(<Wrapper text="hola mundo" highlight="otra" />); // parent re-renders mid-edit
    expect(el.textContent).toBe("hola mundo nuevo"); // untouched while focused
  });
});
