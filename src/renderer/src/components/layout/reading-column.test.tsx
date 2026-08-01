import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import ReadingColumn, {
  readingInset,
  readingInsetChildOverride,
  readingInsetToolbarOverride,
} from "./reading-column";

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
  it("renders the same outer-gutter/inner-cap shape as full/split, with no padding on the outer node", () => {
    render(
      <ReadingColumn variant="doc" data-testid="capped">
        <p>content</p>
      </ReadingColumn>,
    );

    const capped = screen.getByTestId("capped");
    const outer = capped.parentElement as HTMLElement;

    // The outer node EXISTS (T17/RSP-07b: every variant renders the same
    // two-node shape, or FileAnnotator's runtime doc<->full flip remounts
    // the subtree) - it just carries no gutter padding for rule C, since
    // rule C is a percentage of the pane with no gutter of its own.
    expect(outer.className).toContain("w_full");
    expect(outer.className).not.toContain("px_4");

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

// G5 (tasks/responsive-fixes/issues/G5-alineacion-cromo.md), issue 08:
// `readingInset` is the reusable expression a single-node consumer (e.g.
// VTT's Toolbar, T1) needs since it can't render ReadingColumn's own
// two-node shape. These tests pin the FORMULA STRING itself - the actual
// applied geometry (24/24/24/48/48/368 for `full`, 204.5 at 2560 for
// `split`) is verified in playwright/transcription-editor.spec.tsx, which
// runs in a real browser; jsdom performs no layout.
describe("readingInset", () => {
  it("uses the SAME gutter tokens as ReadingColumn's own outer node, for variant full", () => {
    const inset = readingInset("full");
    expect(inset.base).toBe(
      "[max(token(spacing.4), calc((100% - token(sizes.content.max)) / 2))]",
    );
    expect(inset.md).toBe(
      "[max(token(spacing.6), calc((100% - token(sizes.content.max)) / 2))]",
    );
    expect(inset.desktop).toBe(
      "[max(token(spacing.12), calc((100% - token(sizes.content.max)) / 2))]",
    );
  });

  it("uses the content.split cap for variant split, same gutter tokens", () => {
    const inset = readingInset("split");
    expect(inset.base).toBe(
      "[max(token(spacing.4), calc((100% - token(sizes.content.split)) / 2))]",
    );
    expect(inset.md).toBe(
      "[max(token(spacing.6), calc((100% - token(sizes.content.split)) / 2))]",
    );
    expect(inset.desktop).toBe(
      "[max(token(spacing.12), calc((100% - token(sizes.content.split)) / 2))]",
    );
  });
});

describe("readingInsetToolbarOverride", () => {
  it("exposes one class per inset variant, built from readingInset", () => {
    expect(typeof readingInsetToolbarOverride.full).toBe("string");
    expect(typeof readingInsetToolbarOverride.split).toBe("string");
    expect(readingInsetToolbarOverride.full.length).toBeGreaterThan(0);
  });

  it("full and split resolve to different classes (different cap tokens)", () => {
    expect(readingInsetToolbarOverride.full).not.toBe(
      readingInsetToolbarOverride.split,
    );
  });

  it("uses the doubled-class && selector, not a plain child selector", () => {
    expect(readingInsetToolbarOverride.full).toContain("[&&]:");
    expect(readingInsetToolbarOverride.full).not.toContain("[&_>_*]:");
  });
});

// G5 T2 (tasks/responsive-fixes/issues/G5-alineacion-cromo.md), issue 08,
// second half: the AudioPlayer wrapper needs the child-selector shape, but
// still has to raise specificity against the library root's own utility
// class - see readingInsetChildOverride's own docblock for why. As with the
// toolbar override, the FORMULA is pinned here; the actual applied geometry
// (padding computed on the player's content, full-bleed root) is verified in
// playwright/transcription-editor.spec.tsx in a real browser.
describe("readingInsetChildOverride", () => {
  it("exposes one class per inset variant, built from readingInset", () => {
    expect(typeof readingInsetChildOverride.full).toBe("string");
    expect(typeof readingInsetChildOverride.split).toBe("string");
    expect(readingInsetChildOverride.full.length).toBeGreaterThan(0);
  });

  it("full and split resolve to different classes (different cap tokens)", () => {
    expect(readingInsetChildOverride.full).not.toBe(
      readingInsetChildOverride.split,
    );
  });

  it("uses the doubled-class && child (&& > *) selector, applied to the wrapper's child", () => {
    expect(readingInsetChildOverride.full).toContain("[&&_>_*]:");
    expect(readingInsetChildOverride.full).not.toContain("[&&]:");
  });

  it("is a genuinely different class from the toolbar override for the same variant (different selector, same expression)", () => {
    expect(readingInsetChildOverride.full).not.toBe(
      readingInsetToolbarOverride.full,
    );
    expect(readingInsetChildOverride.split).not.toBe(
      readingInsetToolbarOverride.split,
    );
  });
});
