import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import ReadingColumn from "./reading-column";

describe("ReadingColumn — variant full (rule A)", () => {
  it("renders an outer gutter node wrapping an inner capped node", () => {
    render(
      <ReadingColumn variant="full" data-testid="capped">
        <p>content</p>
      </ReadingColumn>,
    );

    const capped = screen.getByTestId("capped");
    const outer = capped.parentElement as HTMLElement;

    // Outer node: gutter only, no cap - this is NOT the node T8/T10 measure.
    expect(outer.className).toContain("w_full");
    expect(outer.className).toContain("px_4");
    expect(outer.className).toContain("md:px_6");
    expect(outer.className).toContain("desktop:px_12");
    expect(outer.className).not.toContain("max-w_content.max");

    // Inner node: the capped element - width/maxWidth/mx, no padding of its
    // own, so border-box === content-box at every viewport (T17).
    expect(capped.className).toContain("w_full");
    expect(capped.className).toContain("mx_auto");
    expect(capped.className).toContain("max-w_content.max");
    expect(capped.className).not.toContain("px_4");
  });
});

describe("ReadingColumn — default variant", () => {
  it("defaults to rule A (full) when no variant is given", () => {
    render(
      <ReadingColumn data-testid="capped">
        <p>content</p>
      </ReadingColumn>,
    );

    const capped = screen.getByTestId("capped");
    expect(capped.className).toContain("max-w_content.max");
  });
});

describe("ReadingColumn — variant split (rule B)", () => {
  it("uses the content.split cap on the same two-node shape", () => {
    render(
      <ReadingColumn variant="split" data-testid="capped">
        <p>content</p>
      </ReadingColumn>,
    );

    const capped = screen.getByTestId("capped");
    const outer = capped.parentElement as HTMLElement;

    expect(outer.className).toContain("desktop:px_12");
    expect(capped.className).toContain("max-w_content.split");
    expect(capped.className).not.toContain("px_4");
  });
});

describe("ReadingColumn — variant doc (rule C)", () => {
  it("renders a single element, percentage of the pane, with no gutter wrapper", () => {
    render(
      <ReadingColumn variant="doc" data-testid="capped">
        <p>content</p>
      </ReadingColumn>,
    );

    const capped = screen.getByTestId("capped");

    // No wrapper: the testid'd node carries the rule-C class directly, and
    // its parent is not another ReadingColumn-rendered gutter node.
    expect(capped.parentElement?.className ?? "").not.toContain("px_4");

    expect(capped.className).toContain("min(88%,_token(sizes.content.doc))");
    expect(capped.className).toContain("mx_auto");
    expect(capped.className).not.toContain("px_4");
    expect(capped.className).not.toContain("max-w_content.max");
  });

  it("forwards an extra className alongside the recipe's classes", () => {
    render(
      <ReadingColumn variant="doc" className="extra">
        <p>content</p>
      </ReadingColumn>,
    );

    const text = screen.getByText("content");
    const column = text.parentElement as HTMLElement;

    expect(column.className).toContain("extra");
    expect(column.className).toContain("min(88%,_token(sizes.content.doc))");
  });
});

// A variant change is a pure STYLE change from the caller's point of view -
// FileAnnotator flips `doc` <-> `full` on every entities-panel toggle
// (file-annotator/index.tsx: `variant={narrowDocument || labelManagerOpen ?
// "doc" : "full"}`). But `doc` renders ONE element and `full`/`split` render
// TWO nested ones, so the element type at the children's position changes
// (`children` vs the inner cap `div`) and React unmounts the whole subtree
// instead of reconciling it: the document DOM is destroyed and rebuilt, every
// `memo`ised Paragraph loses its cache, and all state inside the subtree
// (AnnotationProvider's pending manual-entity-resolution request, any open
// annotation popover, the live text selection an annotation is made from) is
// discarded. Nothing about rule A/C's geometry requires that: the tree shape
// must stay constant across variants (e.g. always render the outer node, with
// the gutter classes only on full/split).
describe("ReadingColumn — variant transitions preserve the subtree", () => {
  function MountProbe({ onMount }: { onMount: () => void }) {
    useEffect(() => {
      onMount();
    }, [onMount]);

    return <p data-testid="probe">content</p>;
  }

  it("does not remount its children when the variant flips from doc to full", () => {
    let mounts = 0;
    const onMount = () => {
      mounts += 1;
    };

    const { rerender } = render(
      <ReadingColumn variant="doc">
        <MountProbe onMount={onMount} />
      </ReadingColumn>,
    );

    const before = screen.getByTestId("probe");
    expect(mounts).toBe(1);

    rerender(
      <ReadingColumn variant="full">
        <MountProbe onMount={onMount} />
      </ReadingColumn>,
    );

    // Mounted exactly once, and still the same DOM node: a style variant
    // must not tear the subtree down.
    expect(mounts).toBe(1);
    expect(screen.getByTestId("probe")).toBe(before);
  });

  it("does not remount its children when the variant flips from full to doc", () => {
    let mounts = 0;
    const onMount = () => {
      mounts += 1;
    };

    const { rerender } = render(
      <ReadingColumn variant="full">
        <MountProbe onMount={onMount} />
      </ReadingColumn>,
    );

    const before = screen.getByTestId("probe");
    expect(mounts).toBe(1);

    rerender(
      <ReadingColumn variant="doc">
        <MountProbe onMount={onMount} />
      </ReadingColumn>,
    );

    expect(mounts).toBe(1);
    expect(screen.getByTestId("probe")).toBe(before);
  });

  // Control case: full <-> split share the two-node shape, so this pair
  // already reconciles. It pins that the fix for doc must not regress it.
  it("does not remount its children when the variant flips from full to split", () => {
    let mounts = 0;
    const onMount = () => {
      mounts += 1;
    };

    const { rerender } = render(
      <ReadingColumn variant="full">
        <MountProbe onMount={onMount} />
      </ReadingColumn>,
    );

    const before = screen.getByTestId("probe");

    rerender(
      <ReadingColumn variant="split">
        <MountProbe onMount={onMount} />
      </ReadingColumn>,
    );

    expect(mounts).toBe(1);
    expect(screen.getByTestId("probe")).toBe(before);
  });
});
