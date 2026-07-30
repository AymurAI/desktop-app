import { TooltipProvider, TutorialGrid } from "@aymurai/ui";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureFlowEnum } from "@/types/features";
import HowItWorks, { tutorialGridOverride } from "./how-it-works";
import HowItWorksModal from "./how-it-works-modal";

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

// jsdom has no ResizeObserver, and Radix's Dialog measures content size when
// it unmounts (Escape-closing it, unlike the pre-existing open-only test,
// exercises that path) - same stub as
// transcription-editor/turn-side-panel.test.tsx uses for the same reason.
vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

// Finds the TutorialGrid root by TOKEN CONTAINMENT rather than a CSS
// selector: `tutorialGridOverride` is a multi-token string whose names
// contain `:`, `[`, `]`, `(`, `)` and `,` (breakpoint prefixes like `lg:`
// and arbitrary-value escapes like `[1fr]`), so `querySelector('.' + cls)`
// without `CSS.escape` throws or mismatches, and `TutorialGrid` merges its
// own recipe classes with ours, so exact string equality on `className`
// also fails. Walking the DOM and checking that every override token is
// present in a node's class list sidesteps both problems.
function findTutorialGrid(container: HTMLElement): HTMLElement | undefined {
  const overrideTokens = tutorialGridOverride.split(/\s+/).filter(Boolean);
  return Array.from(container.querySelectorAll<HTMLElement>("div")).find(
    (el) => {
      const classes = el.className.split(/\s+/);
      return overrideTokens.every((token) => classes.includes(token));
    },
  );
}

describe("HowItWorks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // With the react-i18next mock above, `t` returns `${namespace}:${key}`
  // regardless of whether that key actually exists in the real locale - so
  // this `it.each` proves the NAMESPACE WIRING (the right feature routes to
  // the right translation namespace), not that the copy exists. It would
  // pass identically against an empty locale file. Copy completeness for
  // Summarizer was checked separately against
  // constants/i18n/locales/es/summarizer.ts, which does have
  // howItWorks.step1..step4 (alt/title/subtitle) filled in.
  it.each([
    [FeatureFlowEnum.Dataset, "dataset"],
    [FeatureFlowEnum.Anonymizer, "anonymizer"],
    [FeatureFlowEnum.VoiceToText, "voice-to-text"],
    [FeatureFlowEnum.Summarizer, "summarizer"],
  ])("uses the %s namespace for every feature step", (feature, namespace) => {
    render(<HowItWorks feature={feature} />);

    expect(screen.getByText("common:howItWorks")).toBeInTheDocument();
    for (const step of [1, 2, 3, 4]) {
      expect(
        screen.getByText(`${namespace}:howItWorks.step${step}.title`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${namespace}:howItWorks.step${step}.subtitle`),
      ).toBeInTheDocument();
    }
  });

  it("opens the shared tutorial dialog from the supplied trigger", () => {
    render(
      <TooltipProvider>
        <HowItWorksModal
          feature={FeatureFlowEnum.Dataset}
          trigger={<button type="button">open tutorial</button>}
        />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open tutorial" }));

    expect(
      screen.getByRole("heading", { name: "common:howItWorks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dataset:howItWorks.step1.title"),
    ).toBeInTheDocument();
  });

  // Sad path (CONVENTIONS.md): `buildTutorialSteps` always returns 4 steps
  // (it maps the fixed [1,2,3,4]), so an empty-steps scenario can only be
  // exercised against `TutorialGrid` itself, not through `HowItWorks`.
  it("renders TutorialGrid with an empty steps array without crashing", () => {
    const { container } = render(<TutorialGrid steps={[]} />);

    const grid = container.querySelector("div");
    expect(grid).toBeInTheDocument();
    expect(grid?.children).toHaveLength(0);
  });

  it("close button has the localized aria-label and Escape closes the dialog", async () => {
    render(
      <TooltipProvider>
        <HowItWorksModal
          feature={FeatureFlowEnum.Dataset}
          trigger={<button type="button">open tutorial</button>}
        />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open tutorial" }));

    // `aria-label={t("close")}` uses the UN-namespaced `t`, so under this
    // mock it renders "common:close" - the real locale has `close: "Cerrar"`
    // (constants/i18n/locales/es/common.ts).
    const closeButton = screen.getByRole("button", { name: "common:close" });
    expect(closeButton).toBeInTheDocument();

    // Radix's Dialog listens for Escape on `document`.
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "common:howItWorks" }),
      ).not.toBeInTheDocument();
    });
  });

  // Adversary: the guard below proves both surfaces carry the SAME override
  // class, and says so honestly - it derives its expected tokens FROM
  // `tutorialGridOverride` itself, so it can never notice a change to the
  // override's own definition. That leaves the one thing how-it-works.tsx's
  // docblock calls out as silent and inert - dropping the `"&&"` that wins
  // the (0,1,0) cascade tie against the library's own rule - guarded only by
  // the Playwright CT suite, which neither `pnpm test` nor `pnpm validate`
  // runs. Panda encodes the selector into the class name, so the difference
  // is visible without layout: `"&&"` emits `[&&]:grid-tc_*`, a single `"&"`
  // emits `[&]:grid-tc_*`, and a plain rule emits a bare `grid-tc_*`.
  it("keeps the doubled-class specificity hack that wins the cascade tie", () => {
    const tokens = tutorialGridOverride.split(/\s+/);

    expect(tokens).toContain("[&&]:grid-tc_[1fr]");
    expect(tokens).toContain("[&&]:lg:grid-tc_[repeat(2,_minmax(0,_1fr))]");

    // Both of the shapes that lose the tie, spelled out so a "simplification"
    // back to either one fails here instead of silently reverting issue 02(a).
    // Array `toContain` is exact-element, not substring, so these do not
    // match the `[&&]:`-prefixed tokens above.
    expect(tokens).not.toContain("grid-tc_[1fr]");
    expect(tokens).not.toContain("[&]:grid-tc_[1fr]");
  });

  // The card-alignment half of the same override (G2 issue 02(b)): a direct
  // child selector, which needs no `"&&"` because `.cls > div` (0,1,1)
  // already outranks the library card's own single class (0,1,0).
  it("keeps the direct-child selector that left-aligns the cards", () => {
    const tokens = tutorialGridOverride.split(/\s+/);

    expect(tokens).toContain("[&_>_div]:ai_flex-start");
    // A bare `alignItems` would style the grid root instead of the cards.
    expect(tokens).not.toContain("ai_flex-start");
  });

  // Regression guard for G2 issue 02/03: both surfaces (the page's own
  // TutorialGrid and the modal's recomposed one) must apply the SAME
  // `tutorialGridOverride` class to their grid root - this is what goes red
  // if a future change makes them diverge again. Rendered as two SEPARATE
  // `render()` calls (rather than one shared render) specifically to avoid
  // `common:howItWorks` matching more than once: the modal renders it as
  // both a `DialogTitle` and a `TooltipContent`, and the page renders it via
  // `SectionTitle` - mounting all of that in one tree would make any
  // `getByText("common:howItWorks")` throw on multiple matches. This
  // assertion only proves the override class is PRESENT on both grid roots -
  // it does not prove the override wins the cascade (a plain, non-`&&`
  // `gridTemplateColumns` rule can carry the exact same class and still lose
  // the specificity tie, as `how-it-works.tsx`'s docblock explains); that is
  // proven separately by the computed-style CT guard, and one without the
  // other is false confidence.
  it("applies tutorialGridOverride to the grid root on both the page and the modal", () => {
    const page = render(<HowItWorks feature={FeatureFlowEnum.Dataset} />);
    const pageGrid = findTutorialGrid(page.container);
    expect(pageGrid).toBeTruthy();
    page.unmount();

    render(
      <TooltipProvider>
        <HowItWorksModal
          feature={FeatureFlowEnum.Dataset}
          trigger={<button type="button">open tutorial</button>}
        />
      </TooltipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "open tutorial" }));
    // `DialogContent` renders through a Radix Portal, so its DOM lives
    // outside the render() container - scan `document.body` instead, same
    // as `screen`'s own default query root.
    const modalGrid = findTutorialGrid(document.body);
    expect(modalGrid).toBeTruthy();
  });
});
