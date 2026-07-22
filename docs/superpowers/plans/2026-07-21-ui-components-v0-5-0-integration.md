# @aymurai/ui v0.5.0 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish adopting the `@aymurai/ui` v0.5.0 component set in `desktop-app` — Dialog sizes, SidePanel sizes, AppFooter, FeaturesMenu, TutorialGrid/TutorialDialog, ArchiveRow, and the "one document at a time" preview redesign for Dataset/Anonimizador — delete every local hack/wrapper each one replaces, and fix three bugs found while reviewing the Finalización/validation screens (Anonimizador's missing stepper, Dataset's hang/uncaught rejection on a filesystem failure, and a missing DataGénero credit on both flows' validation footer).

**Architecture:** Twelve independent-or-nearly-independent tasks, each touching one small cluster of existing files. No new top-level modules on the desktop-app side — every task either adds a `size`/prop to an existing `@aymurai/ui` call, rewrites one local component to render a shared one instead of hand-rolled markup, or fixes a small self-contained bug. The two biggest tasks (8 and 9) implement the "un documento por vez" redesign: enforcing a single selected file, then rebuilding the preview screen around `ArchiveView size="lg"` + `ArchiveRow`. Tasks 10-12 are unrelated one-off bugfixes reported directly against the current screens, folded into this plan at the user's request rather than filed separately.

**Tech Stack:** React + TypeScript, Panda CSS (`@/styled/css`, `@/styled/jsx`), TanStack Router, `@aymurai/ui` (consumed live via a workspace symlink — see Global Constraints), i18next, Vitest + React Testing Library.

## Global Constraints

- Package manager is pnpm; do not run `npm install`.
- **`@aymurai/ui` resolves live from source.** `node_modules/@aymurai/ui` in this repo is a symlink to `../../../ui-components` (confirmed: `readlink -f node_modules/@aymurai/ui` → the sibling `ui-components` checkout). `package.json` still says `github:AymurAI/ui-components#v0.4.3`, but that string is irrelevant while the symlink exists — every component and prop added in this plan (`FileDropZone`, `ArchiveView` `size`/`selectable`/`preview-loading`, `ArchiveRow`, `Callout` `size="compact"`, `DialogContent` `size`, `SidePanel` `size`, `TutorialGrid`, `TutorialDialog`, `AppFooter`, `FeaturesMenu`, `FeaturesMenuItem`) is already live and buildable. Before running any command in `desktop-app` that touches `@aymurai/ui`, make sure `ui-components` has a fresh build: `cd ../ui-components && pnpm build`. Do **not** edit `package.json`/`pnpm-lock.yaml` in this plan — the real version bump/tag happens later, separately.
- Panda `strictTokens: true` in this repo too — any arbitrary value needs the `[bracket]` escape.
- Radix primitives come from `@aymurai/ui`, not `@radix-ui/*` directly, in every file this plan touches.
- All user-facing strings already come from i18next (`useTranslation`); don't hardcode new Spanish copy — reuse existing keys wherever the old code already had one, they're called out per task.
- Existing tests mock `react-i18next`'s `useTranslation` as `(key) => key` (see `turn-side-panel.test.tsx`, `how-it-works.test.tsx`) — new/updated tests in this plan follow the same convention, asserting on i18n **keys**, not Spanish copy, except where a test already asserts literal Spanish (some dialogs hardcode copy directly, not via i18n — keep asserting the literal string there).
- Every task ends green on `pnpm test <changed test files>`, `pnpm lint`, and `pnpm typecheck` before moving to the next task.
- Several of the smallest tasks (1, 2) are pure `size` prop additions to already-well-tested or untested static dialogs, with no behavior change — for those, "test" means confirming the existing suite still passes and the dialog still renders (there is no pre-existing dedicated test to extend, and writing a new one that only asserts a CSS class would be low-value/brittle). Tasks with real behavior change (3, 5, 6, 7, 8, 9) get real new/updated assertions.

---

## Task 1: Confirm dialogs → `size="sm"`

**Files:**
- Modify: `src/renderer/src/components/anonymizer/label-manager/remove-dialog.tsx:23`
- Modify: `src/renderer/src/components/anonymizer/label-manager/merge-dialog.tsx:30`
- Modify: `src/renderer/src/components/anonymizer/label-manager/config-tab.tsx:202`
- Modify: `src/renderer/src/components/file/tag-annotation/replace-dialog.tsx:25`
- Modify: `src/renderer/src/components/file/tag-annotation/remove-dialog.tsx:23`

**Interfaces:** None — pure prop addition, no signature changes.

**Context:** These five dialogs all render a bare `<DialogContent>` today, inheriting `@aymurai/ui`'s base width (`min-width:300px`, `max-width:700px`, `width:90vw`). They're all one-off confirmations (delete/merge/replace one thing, two buttons) — exactly the `size="sm"` case (`min(420px,90vw)`, `max-width:420px`). None of them have a dedicated test file today.

- [ ] **Step 1: Add `size="sm"` to each of the five `<DialogContent>` tags**

`src/renderer/src/components/anonymizer/label-manager/remove-dialog.tsx:23`:
```tsx
      <DialogContent size="sm">
```

`src/renderer/src/components/anonymizer/label-manager/merge-dialog.tsx:30`:
```tsx
      <DialogContent size="sm">
```

`src/renderer/src/components/anonymizer/label-manager/config-tab.tsx:202`:
```tsx
          <DialogContent size="sm">
```

`src/renderer/src/components/file/tag-annotation/replace-dialog.tsx:25`:
```tsx
      <DialogContent size="sm">
```

`src/renderer/src/components/file/tag-annotation/remove-dialog.tsx:23`:
```tsx
      <DialogContent size="sm">
```

- [ ] **Step 2: Verify the whole suite still passes and types still check**

Run: `pnpm test`
Expected: same pass count as before this change (no test references these five dialogs directly).

Run: `pnpm typecheck`
Expected: no errors — `size` is a valid `DialogContentProps` member in the live `@aymurai/ui`.

- [ ] **Step 3: Visual smoke check**

Run `pnpm dev:web`, open Anonimizador → Etiquetas → trigger "Eliminar todas las ocurrencias", "Unificar grupos", and "Borrar términos excluidos"; open a tagged entity in a document and trigger "Reemplazar todas las ocurrencias" / "Eliminar ocurrencias con este texto". Confirm each dialog is narrower/more centered than before (max 420px) and still fully readable.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/anonymizer/label-manager/remove-dialog.tsx src/renderer/src/components/anonymizer/label-manager/merge-dialog.tsx src/renderer/src/components/anonymizer/label-manager/config-tab.tsx src/renderer/src/components/file/tag-annotation/replace-dialog.tsx src/renderer/src/components/file/tag-annotation/remove-dialog.tsx
git commit -m "refactor(dialog): consume shared sm size on confirm dialogs"
```

---

## Task 2: Entity-resolution dialog → `size="md"`

**Files:**
- Modify: `src/renderer/src/components/file/manual-entity-resolution-dialog.tsx:142-147`

**Interfaces:** None.

**Context:** This dialog hand-rolls `w: "[min(92vw, 520px)]", maxW: "[520px]", bg: "bg.secondary"` — exactly `@aymurai/ui`'s `size="md"` (`min(520px,92vw)`, `max-width:520px`), plus a redundant `bg` override (`DialogContent` already defaults to `bg.secondary`).

- [ ] **Step 1: Replace the inline override with `size="md"`**

In `src/renderer/src/components/file/manual-entity-resolution-dialog.tsx`, replace:
```tsx
      <DialogContent
        className={css({
          w: "[min(92vw, 520px)]",
          maxW: "[520px]",
          bg: "bg.secondary",
        })}
      >
```
with:
```tsx
      <DialogContent size="md">
```

- [ ] **Step 2: Check whether `css` is still used elsewhere in the file**

Run: `grep -n "css(" src/renderer/src/components/file/manual-entity-resolution-dialog.tsx`

If `css(` has other call sites in the file (it does — `candidateSummary`/`candidateText`/etc. use it elsewhere in this same file per the existing code), keep the `css` import. Only drop the import if this was its sole usage.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: no errors.

Run: `pnpm test`
Expected: same pass count as before (no test covers this dialog's width today).

- [ ] **Step 4: Visual smoke check**

Run `pnpm dev:web`, get to a document with an ambiguous entity group in Anonimizador's tagger, trigger the "grupo similar" resolution dialog. Confirm it's still ~520px wide, content unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/file/manual-entity-resolution-dialog.tsx
git commit -m "refactor(dialog): consume shared md size on entity resolution dialog"
```

---

## Task 3: SidePanel `size="sm"` + scope dialog `size="sm"` in Voz a Texto

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.tsx:58-86,317,359`
- Test: `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx` (existing — must keep passing unmodified; see Step 3)

**Interfaces:**
- Consumes: `@aymurai/ui`'s `SidePanel` `size?: "sm" | "md" | "lg"` (default `"lg"` = 479px) and `DialogContent` `size?: "sm" | "md" | "lg" | "full"`.
- Produces: n/a (leaf UI change).

**Context:** `SidePanel` has no intrinsic width of its own in `@aymurai/ui` prior to v0.5.0's `size` prop — so this file wraps it in a hardcoded `panelColumn` (`width: "[360px]"`), which is exactly what `size="sm"` (360px) now provides natively. The `emptyPanel` placeholder shown before a turn is selected must keep its own 360px width so the layout doesn't jump — it's a plain `<aside>`, not a `SidePanel`, so it can't take the `size` prop itself; hardcode the same number with a comment explaining why. The scope-confirmation dialog inside this same file uses `width: "[min(420px,90vw)]", maxWidth: "[420px]"` — exactly `size="sm"`.

- [ ] **Step 1: Drop the `panelColumn` wrapper width, add `size="sm"` to `SidePanel`, keep `emptyPanel` as a fixed 360px**

In `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.tsx`, replace lines 58-65:
```tsx
// The @aymurai/ui SidePanel has no intrinsic width, so constrain it to a fixed
// right column inside the editor's flex row.
const panelColumn = css({
  flexShrink: "0",
  width: "[360px]",
  borderLeft: "[1px solid #BCBAB8]",
  overflowY: "auto",
});
```
with:
```tsx
const panelColumn = css({
  flexShrink: "0",
  borderLeft: "[1px solid #BCBAB8]",
  overflowY: "auto",
});
```

Replace lines 69-81 (`emptyPanel`) with a version that documents why the width is still hardcoded:
```tsx
// SidePanel's size="sm" is 360px; this placeholder isn't a SidePanel (there's
// no turn selected yet) so it repeats that number directly to avoid a layout
// jump the moment a turn becomes active.
const emptyPanel = css({
  flexShrink: "0",
  width: "[360px]",
  borderLeft: "[1px solid #BCBAB8]",
  bg: "bg.secondary",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  fontSize: "[14px]",
  textAlign: "center",
  p: "6",
});
```

Replace lines 83-86 (`dialogContent`) — delete it entirely, it's no longer needed:
```tsx
const dialogContent = css({
  width: "[min(420px,90vw)]",
  maxWidth: "[420px]",
});
```

At line 319 (the `<SidePanel` opening tag), add `size="sm"`:
```tsx
        <SidePanel
          size="sm"
          turn={{
```

At line 359, replace:
```tsx
        <DialogContent className={dialogContent}>
```
with:
```tsx
        <DialogContent size="sm">
```

- [ ] **Step 2: Confirm `css` import is still needed**

`css` is still used by `emptyPanel`, `cancelLink`, and `panelColumn` in this file — keep the import.

- [ ] **Step 3: Run the existing test file and confirm it's still green, unmodified**

Run: `pnpm test src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx`
Expected: all tests pass, unchanged — none of them assert on pixel widths, only on dispatched actions and rendered text/roles, so this refactor shouldn't need any test edits.

- [ ] **Step 4: Visual smoke check**

Run `pnpm dev:web`, open a Voz a Texto transcript, select a turn (panel should render at the same visual width as before, 360px), then trigger a cross-speaker merge (the scope-choice dialog should still be ~420px wide).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.tsx
git commit -m "refactor(voice-to-text): consume shared side panel and dialog sizes"
```

---

## Task 4: `AppFooter` inside the local `Footer` adapter

**Files:**
- Modify: `src/renderer/src/components/layout/footer.tsx` (full rewrite, still small)
- Test: Create `src/renderer/src/components/layout/footer.test.tsx`

**Interfaces:**
- Consumes: `@aymurai/ui`'s `AppFooter` (`leading?: ReactNode`, `actions?: ReactNode`), `BuiltBy` stays local (`src/renderer/src/components/brand/built-by.tsx`, unchanged).
- Produces: `Footer` keeps its exact current external shape — `{ withBuiltBy?: boolean; children?: ReactNode; className?: string }` — so **none** of its 9 call sites (`voice-to-text/onboarding.tsx`, `voice-to-text/process.tsx`, `voice-to-text/preview.tsx`, `voice-to-text/finish.tsx`, `validate-dataset/index.tsx`, `routes/app.$feature/{onboarding,preview,process,validation}.tsx`) need to change here — two of them (`validate-dataset/index.tsx`, `routes/app.$feature/validation.tsx`) do get their `withBuiltBy` flipped on later, in Task 12, which is unrelated to this task's refactor.

**Context:** `layout/footer.tsx` is a hand-rolled `<footer>` (fixed height, border-top, `BuiltBy` on the left, children right-aligned) — precisely what `AppFooter`'s `leading`/`actions` slots now provide as a shared shell. Making `Footer` a thin wrapper over `AppFooter` means every one of its 9 existing call sites keeps working unmodified.

- [ ] **Step 1: Write the failing test first**

Create `src/renderer/src/components/layout/footer.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "./footer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("Footer", () => {
  it("renders BuiltBy in the leading slot when withBuiltBy is set", () => {
    render(<Footer withBuiltBy>Actions here</Footer>);
    expect(screen.getByText("platformBuiltBy")).toBeInTheDocument();
    expect(screen.getByText("Actions here")).toBeInTheDocument();
  });

  it("omits BuiltBy when withBuiltBy is not set", () => {
    render(<Footer>Actions here</Footer>);
    expect(screen.queryByText("platformBuiltBy")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/layout/footer.test.tsx`
Expected: FAIL — `footer.test.tsx` imports `vi` without importing it from `vitest` yet (fix that), and/or the current `footer.tsx` doesn't render `t("platformBuiltBy")` as visible text in a way this test can assert cleanly. Add `vi` to the `vitest` import in the test:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
```
Re-run — this should now fail because there's no `useTranslation` mock wired to the pre-refactor `BuiltBy` (it calls the real hook), or simply because you haven't changed `footer.tsx` yet and the test is asserting against the post-refactor DOM shape. Confirm you see a real failure (missing text / thrown error), not a false pass.

- [ ] **Step 3: Rewrite `footer.tsx` to wrap `AppFooter`**

Replace the entire contents of `src/renderer/src/components/layout/footer.tsx`:
```tsx
import { AppFooter } from "@aymurai/ui";
import BuiltBy from "../brand/built-by";

interface FooterProps {
  withBuiltBy?: boolean;
  children?: React.ReactNode;
  className?: string;
}
export default function Footer({
  withBuiltBy,
  children,
  className,
}: FooterProps) {
  return (
    <AppFooter
      className={className}
      leading={withBuiltBy ? <BuiltBy size={120} gap="0" /> : undefined}
      actions={children}
    />
  );
}
```

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/components/layout/footer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run every test file that renders a page including `Footer`, to catch layout-assumption regressions**

Run: `pnpm test src/renderer/src/components/voice-to-text/validation.test.tsx`
Expected: PASS — this is the one existing test file that renders a full page including `Footer` (per the repo-wide `Footer` usage grep). If it fails, check whether it's asserting on `Footer`'s internal DOM structure (e.g., a specific wrapper `className`) rather than visible content — if so, that assertion needs to change to match `AppFooter`'s DOM instead, not be worked around.

- [ ] **Step 6: Visual smoke check**

Run `pnpm dev:web`, visit one screen per flow (e.g. Anonimizador onboarding, Dataset preview, Voz a Texto process) and confirm the footer still shows "Plataforma hecha por" + the DataGénero logo on the left and the action button(s) on the right, unchanged from before.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/layout/footer.tsx src/renderer/src/components/layout/footer.test.tsx
git commit -m "refactor(layout): consume AppFooter inside the local Footer adapter"
```

---

## Task 5: `FeaturesMenu`/`FeaturesMenuItem` in the header apps dropdown

**Files:**
- Modify: `src/renderer/src/components/features-menu.tsx` (full rewrite)
- Delete: `src/renderer/src/components/feature-icon.tsx`
- Test: Create `src/renderer/src/components/features-menu.test.tsx`

**Interfaces:**
- Consumes: `@aymurai/ui`'s `FeaturesMenu` (grid chrome, takes `children`), `FeaturesMenuItem` (`icon: ReactNode; label: string; disabled?: boolean; fullWidth?: boolean; onClick?: () => void`).
- Produces: `FeaturesMenu` (the desktop-app component) keeps its exact external shape — `{ trigger?: ReactElement }` — so `layout/header.tsx:47` (`apps: (apps) => <FeaturesMenu trigger={apps} />`) doesn't change.

**Context:** Today this file builds each row from `@aymurai/ui`'s generic `Card size="sm" clickable` plus a **local** `FeatureIcon` component (`feature-icon.tsx` — 16px icon-box/card radius) — not `CardTool`, not the new `FeaturesMenuItem`. Per Figma (node `40000732:79289`), both the card and its icon box should be `8px` radius; `FeaturesMenuItem` already implements that exactly. `FeatureIcon` becomes dead code once this file stops importing it — confirmed via `grep -rln "feature-icon" src/renderer/src` that `features-menu.tsx` is its only consumer.

`onClick` navigation: `FeaturesMenuItem` takes a plain `onClick`, not a `Link`-wrapping pattern — so each item's router navigation moves from wrapping `<Link>...</Link>` around the card to calling TanStack Router's imperative `navigate()` from `onClick` (this also sidesteps `fullWidth`'s `grid-column: 1 / -1` only working when applied to the actual grid child, which a `<Link>` wrapper would otherwise intercept).

- [ ] **Step 1: Write the failing test first**

Create `src/renderer/src/components/features-menu.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeaturesMenu from "./features-menu";

const dispatch = vi.fn();
vi.mock("@/hooks/useFiles", () => ({
  useFileDispatch: () => dispatch,
}));

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

describe("FeaturesMenu", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockClear();
  });

  it("navigates to a feature and clears files on click", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByText("dataset:title"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/app/$feature",
        params: { feature: "DATA_SET" },
      }),
    );
  });

  it("renders a full-width Configuración row with no Figma-backed feature behind it", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByText("common:settings"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/home/host" }),
    );
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/features-menu.test.tsx`
Expected: FAIL — the current `features-menu.tsx` wraps each item in a `<Link>` and never calls `useNavigate()`, so the `navigate` mock is never called and both assertions on it fail. Confirm the failure is specifically about `navigate` not being called, not a setup/import error.

- [ ] **Step 3: Rewrite `features-menu.tsx`**

Replace the entire contents of `src/renderer/src/components/features-menu.tsx`:
```tsx
import { useFileDispatch } from "@/hooks/useFiles";
import { removeAllFiles } from "@/reducers/file/actions";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { FEATURE_ICON } from "@/constants/config";
import {
  FeaturesMenu as FeaturesMenuGrid,
  FeaturesMenuItem,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { DotsNine, Gear } from "phosphor-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

interface FeaturesMenuProps {
  trigger?: ReactElement;
}

export default function FeaturesMenu({ trigger }: FeaturesMenuProps) {
  const { t } = useTranslation();
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const features = Object.values(FeatureFlowEnum);

  const handleClearFiles = () => {
    dispatch(removeAllFiles());
  };

  const goToFeature = (feature: FeatureFlowEnum) => {
    handleClearFiles();
    navigate({ to: "/app/$feature", params: { feature } });
  };

  const goToSettings = () => {
    handleClearFiles();
    navigate({ to: "/home/host" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            size="icon-sm"
            style={{ padding: 2 }}
            aria-label="Ir al inicio"
          >
            <DotsNine size={32} />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        style={{ background: "transparent", borderRadius: 0, boxShadow: "none" }}
      >
        <FeaturesMenuGrid>
          {features.map((feature) => {
            const Icon = FEATURE_ICON[feature];
            return (
              <FeaturesMenuItem
                key={feature}
                icon={<Icon size={24} />}
                label={t("title", { ns: featureNamespace[feature] })}
                onClick={() => goToFeature(feature)}
              />
            );
          })}
          <FeaturesMenuItem
            icon={<Gear size={24} />}
            label={t("settings")}
            fullWidth
            onClick={goToSettings}
          />
        </FeaturesMenuGrid>
      </PopoverContent>
    </Popover>
  );
}
```

Note the `PopoverContent` override (`background: transparent`, no radius/shadow) — `FeaturesMenuGrid` (the library's `FeaturesMenu`) already supplies its own `bg.primary`/rounded/shadow chrome; without this override the two would double up (confirmed working in `ui-components`' own `FeaturesMenu.stories.tsx` "InsidePopover" story).

- [ ] **Step 4: Delete the now-dead `feature-icon.tsx`**

```bash
rm src/renderer/src/components/feature-icon.tsx
```

- [ ] **Step 5: Run the new test, confirm it passes**

Run: `pnpm test src/renderer/src/components/features-menu.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the header test to confirm the mocked module boundary still holds**

Run: `pnpm test src/renderer/src/components/layout/header.test.tsx`
Expected: PASS — this file mocks `../features-menu` wholesale, so it's insulated from this rewrite.

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors, no dangling `feature-icon` imports anywhere (`grep -rln "feature-icon" src/renderer/src` returns nothing).

- [ ] **Step 8: Visual smoke check**

Run `pnpm dev:web`, click the apps (dots) icon in the header from any screen. Confirm: 8px-rounded cards, 8px-rounded icon boxes, "Configuración" spans the full row width, clicking any item navigates and closes the popover.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/components/features-menu.tsx src/renderer/src/components/features-menu.test.tsx
git rm src/renderer/src/components/feature-icon.tsx
git commit -m "refactor(header): consume shared FeaturesMenu and FeaturesMenuItem"
```

---

## Task 6: `TutorialGrid`/`TutorialDialog` for "¿Cómo funciona?"

**Files:**
- Modify: `src/renderer/src/components/how-it-works.tsx` (full rewrite)
- Modify: `src/renderer/src/components/how-it-works-modal.tsx` (full rewrite, much smaller)
- Modify: `src/renderer/src/components/how-it-works.test.tsx`

**Interfaces:**
- Consumes: `@aymurai/ui`'s `TutorialGrid` (`steps: { image: string; imageAlt: string; title: string; description: string }[]`), `TutorialDialog` (`trigger: ReactNode; title: string; steps: TutorialStep[]; closeLabel?: string`), `DialogContent size="lg"` (used internally by `TutorialDialog`, not called directly here).
- Produces: `HowItWorks` keeps its props (`title?: ReactNode; feature: FeatureFlowEnum`) since nothing outside this file renders it directly except `HowItWorksModal` and the two onboarding routes (`routes/app.$feature/onboarding.tsx:8,103`, `voice-to-text/onboarding.tsx:7,80`) — those call sites are unaffected, `HowItWorks` still renders a titled step grid on its own (used inline on first-visit onboarding, not inside a dialog). `HowItWorksModal` keeps its props (`feature: FeatureFlowEnum; trigger?: ReactElement`) — `layout/header.tsx:45` doesn't change.

**Context:** Today `how-it-works.tsx` builds its own `Card`/`Grid columns={2}`/step-badge markup (non-responsive — always 2 columns, unlike the shared `TutorialGrid`, which collapses to 1 column on narrow windows) and `how-it-works-modal.tsx` wraps it with a hand-rolled `minWidth:[900px] / maxW:5xl! / maxH:[90vh] / overflowY:auto` + inline `width:90vw` — exactly the hack `size="lg"` on `DialogContent` replaces. `HowItWorksModal` currently builds its own title+close-button row (`HStack` + `SectionTitle` + `DialogClose`) and passes it into `HowItWorks`'s `title` prop; `TutorialDialog` now owns that whole header row internally, so `HowItWorksModal` shrinks to just supplying `trigger`/`title`/`steps`.

- [ ] **Step 1: Rewrite `how-it-works.tsx` to build a `steps` array and render `TutorialGrid`**

Replace the entire contents of `src/renderer/src/components/how-it-works.tsx`:
```tsx
import { SectionTitle } from "@/layout/section-title";
import { Stack } from "@/styled/jsx";
import { type FeatureFlowEnum, featureNamespace } from "@/types/features";
import { TutorialGrid, type TutorialStep } from "@aymurai/ui";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

function buildSteps(tFeature: TFunction): TutorialStep[] {
  return [1, 2, 3, 4].map((step) => ({
    image: `${import.meta.env.BASE_URL}onboarding-steps/step${step}.png`,
    imageAlt: tFeature(`howItWorks.step${step}.alt`),
    title: tFeature(`howItWorks.step${step}.title`),
    description: tFeature(`howItWorks.step${step}.subtitle`),
  }));
}

interface HowItWorksProps {
  title?: React.ReactNode;
  feature: FeatureFlowEnum;
}
export default function HowItWorks({ title, feature }: HowItWorksProps) {
  const { t } = useTranslation();
  const { t: tFeature } = useTranslation(featureNamespace[feature]);

  const renderTitle =
    typeof title === "string" ? (
      <SectionTitle>{title}</SectionTitle>
    ) : (
      (title ?? <SectionTitle>{t("howItWorks")}</SectionTitle>)
    );

  return (
    <Stack gap="6">
      {renderTitle}
      <TutorialGrid steps={buildSteps(tFeature)} />
    </Stack>
  );
}
```

- [ ] **Step 2: Rewrite `how-it-works-modal.tsx` to delegate to `TutorialDialog`**

Replace the entire contents of `src/renderer/src/components/how-it-works-modal.tsx`:
```tsx
import type { FeatureFlowEnum } from "@/types/features";
import { featureNamespace } from "@/types/features";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TutorialDialog,
  type TutorialStep,
} from "@aymurai/ui";
import { Question } from "phosphor-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

function buildSteps(tFeature: (key: string) => string): TutorialStep[] {
  return [1, 2, 3, 4].map((step) => ({
    image: `${import.meta.env.BASE_URL}onboarding-steps/step${step}.png`,
    imageAlt: tFeature(`howItWorks.step${step}.alt`),
    title: tFeature(`howItWorks.step${step}.title`),
    description: tFeature(`howItWorks.step${step}.subtitle`),
  }));
}

interface HowItWorksModalProps {
  feature: FeatureFlowEnum;
  trigger?: ReactElement;
}
export default function HowItWorksModal({
  feature,
  trigger,
}: HowItWorksModalProps) {
  const { t } = useTranslation();
  const { t: tFeature } = useTranslation(featureNamespace[feature]);

  const defaultTrigger = (
    <button type="button" aria-label="Información sobre AymurAI">
      <Question size={32} />
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TutorialDialog
          trigger={trigger ?? defaultTrigger}
          title={t("howItWorks")}
          steps={buildSteps(tFeature)}
          closeLabel={t("close")}
        />
      </TooltipTrigger>
      <TooltipContent>{t("howItWorks")}</TooltipContent>
    </Tooltip>
  );
}
```

Check whether the `close` i18n key already exists: run `grep -rn '"close"' src/renderer/src/constants/i18n/locales/es/common.ts`. If it doesn't exist yet, add it next to the `settings` key in that same file:
```ts
close: "Cerrar",
```

- [ ] **Step 3: Update `how-it-works.test.tsx` — it still renders the same visible text, but through a different component tree**

The existing test (`src/renderer/src/components/how-it-works.test.tsx`) already only asserts on visible text (`screen.getByText(...)`), not on internal DOM structure — it should keep passing unmodified, since `TutorialGrid` still renders `title`/`description` as visible text per step. Run it first to confirm before touching anything else:

Run: `pnpm test src/renderer/src/components/how-it-works.test.tsx`
Expected: PASS with no changes needed. If it fails, the most likely cause is `TutorialGrid`'s per-step `title` rendering as an `<h2>` rather than the old code's `styled.h2` — `screen.getByText` matches by text content regardless of tag, so this should not be the cause; if it fails, read the actual error before changing the test, don't guess.

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 5: Visual smoke check**

Run `pnpm dev:web`. Check: (a) first-visit onboarding for each of the 3 flows still shows the 4-step grid inline with a title; (b) after the tutorial's been seen once, the header's "?" button opens the same 4 steps in a dialog with a title bar + close X; (c) resize the window narrow — the dialog should stay within the viewport (no horizontal scroll) and the grid should collapse to 1 column, unlike before.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/how-it-works.tsx src/renderer/src/components/how-it-works-modal.tsx src/renderer/src/constants/i18n/locales/es/common.ts
git commit -m "refactor(onboarding): consume shared TutorialGrid and TutorialDialog"
```

---

## Task 7: `ArchiveRow` in the Voz a Texto file list, and a shared `formatFileSize`

**Files:**
- Create: `src/renderer/src/utils/file/formatFileSize.ts`
- Test: Create `src/renderer/src/utils/file/formatFileSize.test.ts`
- Modify: `src/renderer/src/utils/file/index.ts` (add the new export)
- Modify: `src/renderer/src/components/voice-to-text/preview.tsx` (the `FileRow` function and its call site, lines 30-124)

**Interfaces:**
- Consumes: `@aymurai/ui`'s `ArchiveRow` (`icon: ReactNode; title: string; description: string; leadingAction?: ReactNode; trailingAction?: ReactNode`).
- Produces: `formatFileSize(bytes: number): string` — exported from `@/utils/file`, kb below 1mb / mb below 1gb / gb beyond that. Task 9 (Step 3) imports this same function instead of hand-rolling its own mb-only formatting — that's the fix for the "0.0 mb" bug on small files reported while reviewing this plan.

**Context:** `FileRow` here (icon-less play button on the left, filename+duration/size in the middle, trash on the right) is structurally identical to `ArchiveRow`'s `leadingAction` + `icon` + title/description + `trailingAction` shape — it's the VTT half of exactly the row `ArchiveRow` was built to cover (see `ui-components`' own `ArchiveRow.stories.tsx`, "WithLeadingAction" story, which uses this exact file's copy as its example). `ArchiveRow` requires an `icon` in addition to the play button — use `FileAudio`, matching the icon `@aymurai/ui`'s own story uses for this exact case.

This file already has a local, unexported `formatFileSize` (mb above 1mb, kb below — no gb tier). Rather than duplicate that logic in Task 9's `file-preview/index.tsx` (which is what originally produced the "0.0 mb" bug — it hardcoded mb-only formatting with no kb fallback), extract this one into a shared util first, extend it with a gb tier while at it, and have both files import the same function.

- [ ] **Step 1: Write the failing test for the shared util first**

Create `src/renderer/src/utils/file/formatFileSize.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import formatFileSize from "./formatFileSize";

describe("formatFileSize", () => {
  it("formats sub-megabyte sizes in kb", () => {
    expect(formatFileSize(2048)).toBe("2 kb");
    expect(formatFileSize(51_200)).toBe("50 kb"); // ~50kb docx, the "0.0 mb" bug case
  });

  it("formats megabyte-scale sizes in mb", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 mb");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 mb");
  });

  it("formats gigabyte-scale sizes in gb", () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe("2.0 gb");
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/utils/file/formatFileSize.test.ts`
Expected: FAIL — `./formatFileSize` doesn't exist yet.

- [ ] **Step 3: Create the shared util**

Create `src/renderer/src/utils/file/formatFileSize.ts`:
```ts
/**
 * Formats a byte count with the smallest unit that keeps it readable: kb
 * below 1mb, mb below 1gb, gb beyond that — instead of always showing mb,
 * which rounds small files (a lightweight docx, for instance) down to a
 * meaningless "0.0 mb".
 */
export default function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} kb`;

  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} mb`;

  const gb = mb / 1024;
  return `${gb.toFixed(1)} gb`;
}
```

Add it to the barrel, `src/renderer/src/utils/file/index.ts`:
```ts
import formatFileSize from "./formatFileSize";
```
and in the `export { ... }` block:
```ts
  formatFileSize,
```

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/utils/file/formatFileSize.test.ts`
Expected: PASS.

- [ ] **Step 5: Replace `FileRow`'s body with `ArchiveRow`, and its local `formatFileSize` with the shared one**

Delete the local function at the top of `src/renderer/src/components/voice-to-text/preview.tsx`:
```ts
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
  }
  return `${Math.round(bytes / 1024)} kb`;
}
```

Add the shared one to this file's existing `@/utils/file`-adjacent imports (if this file doesn't already import from `@/utils/file`, add a new import line):
```ts
import { formatFileSize } from "@/utils/file";
```

Then replace the whole `FileRow` function (currently lines 69-124):

In `src/renderer/src/components/voice-to-text/preview.tsx`, replace the whole `FileRow` function (currently lines 69-124):
```tsx
function FileRow({ file, onRemove }: { file: DocFile; onRemove: () => void }) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useFileDispatch();
  const { durationMs, isPlaying, toggle } = useAudioSnippet(file.data, {
    onDuration: (detectedDurationMs) => {
      dispatch(setFileDuration(file.data.name, detectedDurationMs));
    },
  });
  const displayedDurationMs = durationMs || file.durationMs || 0;

  return (
    <ArchiveRow
      icon={<FileAudio size={24} />}
      title={file.data.name}
      description={t("preview.meta", {
        duration: formatDuration(displayedDurationMs),
        size: formatFileSize(file.data.size),
      })}
      leadingAction={
        <button
          type="button"
          className={playButton}
          onClick={toggle}
          aria-label={
            isPlaying
              ? t("preview.pauseAria", { name: file.data.name })
              : t("preview.playAria", { name: file.data.name })
          }
        >
          {isPlaying ? (
            <Pause size={28} weight="fill" />
          ) : (
            <Play size={28} weight="fill" />
          )}
        </button>
      }
      trailingAction={
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("preview.removeAria", { name: file.data.name })}
          className={removeButton}
        >
          <Trash size={24} />
        </button>
      }
    />
  );
}
```

Delete the now-unused `fileRow` style constant (lines 30-42) — `ArchiveRow` owns that layout now. Keep `playButton` and `removeButton` — they still style the two buttons passed as actions.

Update the imports at the top of the file: add `ArchiveRow` and `FileAudio` to the existing `@aymurai/ui`/`phosphor-react` import lines:
```tsx
import { Pause, Play, Trash, FileAudio } from "phosphor-react";
```
```tsx
import { ArchiveRow, Button, Card } from "@aymurai/ui";
```

- [ ] **Step 6: Check for an existing test file covering `preview.tsx`**

Run: `find src/renderer/src/components/voice-to-text -iname "preview.test.tsx"`
If one exists covering this file, read it and re-run it now before changing anything further:
Run: `pnpm test src/renderer/src/components/voice-to-text/preview.test.tsx`
Expected: PASS unmodified — the test should be asserting on visible text/roles (filename, duration/size string, "Reproducir"/"Pausar"/"Eliminar" aria-labels), all of which `ArchiveRow` still renders identically since the same elements are just passed in as `leadingAction`/`trailingAction` instead of being inlined, and `formatFileSize`'s output format is unchanged for anything under 1gb.

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors, no unused `fileRow` reference left behind (`grep -n "fileRow" src/renderer/src/components/voice-to-text/preview.tsx` should return nothing), no duplicate local `formatFileSize` left in this file.

- [ ] **Step 8: Visual smoke check**

Run `pnpm dev:web`, add an audio file to Voz a Texto, confirm each row still shows the play button, filename, duration/size, and trash icon in the same visual position, and that play/pause/remove all still work. Try a file under 1mb — confirm its size still reads in kb, not "0.0 mb".

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/utils/file/formatFileSize.ts src/renderer/src/utils/file/formatFileSize.test.ts src/renderer/src/utils/file/index.ts src/renderer/src/components/voice-to-text/preview.tsx
git commit -m "refactor(voice-to-text): consume ArchiveRow and a shared formatFileSize"
```

---

## Task 8: Enforce a single selected file for Dataset/Anonimizador

**Files:**
- Modify: `src/renderer/src/routes/app.$feature/onboarding.tsx:55-62,118-123`

**Interfaces:**
- Consumes: nothing new from `@aymurai/ui` (this task is pure desktop-app behavior).
- Produces: after this task, `useFiles()` holds at most one entry whenever `feature !== FeatureFlowEnum.VoiceToText`. Task 9 depends on this being true, but also defensively only ever looks at `files[0]` regardless, so task order isn't a hard requirement.

**Context:** Per product decision, Dataset and Anonimizador move to "one document per full cycle" (select → preview → process → finish → back to selection to start the next one) — Anonimizador's hidden input is already `multiple={false}`, but (a) its file picker still receives whatever `handleAddFiles` is given, and (b) `FileDropZone`'s drag-and-drop path bypasses the `<input>`'s `multiple` attribute entirely (that attribute only constrains the OS file-picker dialog), so dragging 3 files onto either flow today still adds all 3. Dataset's input is `multiple={feature === FeatureFlowEnum.Dataset}` — that becomes unconditionally `false`. Both flows also need `handleAddFiles` to guarantee "at most one file, replacing whatever was there" rather than appending — otherwise a stale file from a previous cycle could combine with a newly added one.

- [ ] **Step 1: Write the failing test first**

Create `src/renderer/src/routes/app.$feature/onboarding.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "./onboarding";

const dispatch = vi.fn();
vi.mock("@/hooks", () => ({ useFileDispatch: () => dispatch }));

const navigate = vi.fn().mockResolvedValue(undefined);
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useParams: () => ({ feature: "DATA_SET" }),
  createFileRoute: () => (opts: unknown) => opts,
}));

vi.mock("@/store/useLocal", () => ({
  useTutorialSeen: () => true,
  useSetTutorialSeen: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ removeQueries: vi.fn() }),
}));

describe("Dataset onboarding — single file enforcement", () => {
  beforeEach(() => dispatch.mockClear());

  it("clears any previous selection before adding the newly dropped file", async () => {
    const RouteComponent = Route.options.component;
    render(<RouteComponent />);

    const dropZone = screen.getByText("onboarding.dropAreaTitle");
    const file = new File(["x"], "a.docx");
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    // First dispatch clears prior state, second adds the single new file.
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0][0]).toEqual(
      expect.objectContaining({ type: "REMOVE_ALL_FILES" }),
    );
    expect(dispatch.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        type: "ADD",
        payload: { newFiles: [file] },
      }),
    );
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/routes/app.\$feature/onboarding.test.tsx`
Expected: FAIL — `handleAddFiles` today only dispatches `addFiles(files)` once, with no `removeAllFiles()` first, and `FileDropZone`'s `onDrop` isn't wired to a real drag event the way this test simulates (check the actual failure message — if it's about `fireEvent.drop` not reaching `FileDropZone`'s handler because of how the mocked `@aymurai/ui` resolves, that's expected too, since `@aymurai/ui` is NOT mocked here on purpose — it should render for real via the live symlink). If the failure is a resolution error unrelated to the assertion, fix the test setup, don't skip the assertion.

- [ ] **Step 3: Enforce single-file behavior in `DocumentOnboarding`**

In `src/renderer/src/routes/app.$feature/onboarding.tsx`, replace:
```tsx
  const handleAddFiles = async (files: File[]) => {
    dispatch(addFiles(files));
    await navigate({
      to: "/app/$feature/preview",
      params: { feature },
    });
    toggleTutorialSeen(feature);
  };
```
with:
```tsx
  const handleAddFiles = async (files: File[]) => {
    dispatch(removeAllFiles());
    dispatch(addFiles(files.slice(0, 1)));
    await navigate({
      to: "/app/$feature/preview",
      params: { feature },
    });
    toggleTutorialSeen(feature);
  };
```

Add `removeAllFiles` to the existing action import:
```tsx
import { addFiles, removeAllFiles } from "@/reducers/file/actions";
```

Replace the `onDrop` handler so it only ever passes through a single allowed file:
```tsx
              onDrop={(files) => {
                const allowedFiles = files.filter((file) =>
                  isAllowed(file, DOCUMENT_EXTENSIONS),
                );
                if (allowedFiles.length > 0)
                  handleAddFiles(allowedFiles.slice(0, 1));
              }}
```

And drop the now-always-`false` `multiple` condition on `HiddenInput`:
```tsx
      <HiddenInput
        ref={inputRef}
        onChange={handleInputChange}
        extensions={DOCUMENT_EXTENSIONS}
      />
```

(`HiddenInput`'s `multiple` prop defaults to `false` — confirm by reading `src/renderer/src/components/hidden-input.tsx`'s prop defaults before deleting the line, to make sure omitting it doesn't leave `multiple` in an unexpected state.)

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/routes/app.\$feature/onboarding.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 6: Visual smoke check**

Run `pnpm dev:web`. In Dataset, try to select multiple files via the OS file picker (should no longer be possible — single-select dialog) and via drag-and-drop of 2+ files (only the first should be added). Repeat for Anonimizador (already single-file via the input, confirm drag-and-drop of 2+ files is now also capped to 1).

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/routes/app.\$feature/onboarding.tsx src/renderer/src/routes/app.\$feature/onboarding.test.tsx
git commit -m "fix(onboarding): enforce a single selected document for dataset and anonimizador"
```

---

## Task 9: Single-document preview redesign

**Files:**
- Modify: `src/renderer/src/components/file-preview/index.tsx` (full rewrite)
- Modify: `src/renderer/src/routes/app.$feature/preview.tsx` (rewrite `DocumentPreview`, lines 38-130)
- Modify: `src/renderer/src/components/document-archives.test.tsx` (drop the `FilePreview`-specific test; keep the `FileProcessing` one — it's unrelated and already passing)

**Interfaces:**
- Consumes: `@aymurai/ui`'s `ArchiveView` (`type: "preview" | "preview-loading" | "preview-error"`, `size="lg"`, no `selectable` needed since there's nothing to select against anymore), `ArchiveRow` (icon/title/description/trailingAction), `Card`, `Button`; and Task 7's `formatFileSize` from `@/utils/file` (run Task 7 first — if run out of order, `file-preview/index.tsx` will fail to import a function that doesn't exist yet).
- Produces: `FilePreview` now takes `{ file: DocFile; status: PredictStatus; onRemove: () => void }` (adds `onRemove`, drops nothing else consumers relied on — its only consumer is the rewritten `DocumentPreview` in this same task).

**Context:** Per the "one document per cycle" decision (Task 8), there is now at most one file in state for Dataset/Anonimizador, so the whole batch grid (`Grid columns={5}` of `FilePreview`), the checkbox/selection machinery (`withoutSelection` hack, `selected`/`onSelect`), and "Cargar más documentos" no longer make sense — there's nothing to select among and no "more" to load until the current file is removed. This is the screen the whole `ArchiveView size="lg"` + `ArchiveRow` combination (`ui-components` Fase 3, Figma node `40002579:88220`) was built for.

Page count isn't derivable from anything the parse response returns (`Paragraph[]` has no page metadata) — the Figma mock's "N pag." is replaced with a paragraph count instead, which **is** real data (`file.paragraphs.length`), clearly documented as a deliberate substitution.

- [ ] **Step 1: Write the failing test first**

Create `src/renderer/src/components/file-preview/index.test.tsx` (this component had no dedicated test before — the coverage lived in `document-archives.test.tsx`, which is being retired for this component in Step 5):
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilePreview from "./index";
import type { DocFile } from "@/types/file";

const file: DocFile = {
  data: new File(["document"], "sample.docx"),
  paragraphs: [
    { id: "1", document_id: "sample", value: "Primer párrafo" },
    { id: "2", document_id: "sample", value: "Segundo párrafo" },
  ],
  selected: true,
};

describe("FilePreview", () => {
  it("renders the parsed preview plus an ArchiveRow with a trailing remove action", () => {
    const onRemove = vi.fn();
    render(<FilePreview file={file} status="completed" onRemove={onRemove} />);

    const preview = screen.getByRole("img", { name: "sample.docx" });
    expect(preview).toHaveAttribute(
      "src",
      expect.stringContaining("data:image/svg+xml"),
    );
    expect(screen.getByText("sample.docx")).toBeInTheDocument();
    expect(screen.getByText(/2 párrafos/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("shows a spinner while the file is still parsing, with no ArchiveRow yet", () => {
    render(
      <FilePreview
        file={{ ...file, paragraphs: undefined }}
        status="processing"
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument(); // Spinner's role="status"
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
  });

  it("shows the error frame on parse failure", () => {
    render(<FilePreview file={file} status="error" onRemove={vi.fn()} />);
    expect(screen.getByText("Error de carga.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/file-preview/index.test.tsx`
Expected: FAIL — the current `FilePreview` doesn't accept an `onRemove` prop, doesn't render an `ArchiveRow`, and still shows a checkbox instead.

- [ ] **Step 3: Rewrite `file-preview/index.tsx`**

Replace the entire contents of `src/renderer/src/components/file-preview/index.tsx`:
```tsx
import type { PredictStatus } from "@/hooks/usePredict";
import { css } from "@/styled/css";
import type { DocFile } from "@/types/file";
import { formatFileSize } from "@/utils/file";
import { ArchiveRow, ArchiveView, Button } from "@aymurai/ui";
import { File as FileIcon, Trash } from "phosphor-react";

const escapeMarkup = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const previewDataUri = (file: DocFile) => {
  const text = file.paragraphs?.map((paragraph) => paragraph.value).join("\n");
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="367" height="426"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;padding:16px;font-family:sans-serif;font-size:12px;line-height:1.4;color:#110041;white-space:pre-wrap;overflow:hidden">${escapeMarkup(text?.slice(0, 4000) ?? "")}</div></foreignObject></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
};

// Page count isn't available from the parse response (Paragraph[] carries no
// page metadata) — paragraph count is the closest real substitute for the
// Figma mock's "N pag.". Backend ticket filed separately to add real page
// count to the parse response; revisit this once that lands.
//
// formatFileSize (Task 7) scales kb/mb/gb dynamically — no more "0.0 mb" on
// small files.
function formatFileMeta(file: DocFile): string {
  const paragraphCount = file.paragraphs?.length ?? 0;
  return `${paragraphCount} párrafos - ${formatFileSize(file.data.size)}`;
}

const row = css({ maxW: "[366px]" });

interface Props {
  file: DocFile;
  status: PredictStatus;
  onRemove: () => void;
}
export default function FilePreview({ file, status, onRemove }: Props) {
  const isError = status === "error";
  const isPending = status === "processing" || !file.paragraphs;

  if (isError) {
    return <ArchiveView type="preview-error" size="lg" fileName={file.data.name} />;
  }

  if (isPending) {
    return (
      <ArchiveView type="preview-loading" size="lg" fileName={file.data.name} />
    );
  }

  return (
    <div
      className={css({
        display: "flex",
        flexDir: "column",
        alignItems: "center",
        gap: "6",
      })}
    >
      <ArchiveView
        type="preview"
        size="lg"
        src={previewDataUri(file)}
        fileName={file.data.name}
      />
      <ArchiveRow
        className={row}
        icon={<FileIcon size={24} />}
        title={file.data.name}
        description={formatFileMeta(file)}
        trailingAction={
          <Button
            variant="tertiary"
            size="icon-sm"
            aria-label="Eliminar archivo"
            onClick={onRemove}
            style={{ padding: 4 }}
          >
            <Trash size={24} />
          </Button>
        }
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/components/file-preview/index.test.tsx`
Expected: PASS.

- [ ] **Step 5: Retire the `FilePreview` half of `document-archives.test.tsx`**

In `src/renderer/src/components/document-archives.test.tsx`, remove the `FilePreview` import and its one test case (the `"renders parsed documents through ArchiveView and keeps selection"` test) — that coverage now lives in `file-preview/index.test.tsx` (Step 1) with assertions matching the new behavior. Keep the `FileProcessing`-related import, mocks, and test (`"maps processing, stopped and error states to ArchiveProgress"`) exactly as they are — unrelated to this task, already passing, already correct.

The file should end up as:
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FileProcessing from "./file-processing";

const dispatch = vi.fn();

vi.mock("@/hooks", () => ({
  useFileDispatch: () => dispatch,
}));

const withQueryClient = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("document archive components", () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  it("maps processing, stopped and error states to ArchiveProgress", () => {
    const onAbort = vi.fn();
    const { rerender } = render(
      withQueryClient(
        <FileProcessing
          fileName="sample.docx"
          status="processing"
          progress={0.42}
          onAbort={onAbort}
        />,
      ),
    );

    expect(screen.getByText("42%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Detener" }));
    expect(onAbort).toHaveBeenCalledOnce();

    rerender(
      withQueryClient(
        <FileProcessing
          fileName="sample.docx"
          status="stopped"
          progress={0.42}
          onAbort={onAbort}
        />,
      ),
    );

    expect(screen.getByRole("button", { name: "Detener" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Reemplazar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Descartar" })).toBeNull();

    rerender(
      withQueryClient(
        <FileProcessing
          fileName="sample.docx"
          status="error"
          progress={0.42}
          onAbort={onAbort}
        />,
      ),
    );

    expect(
      screen.getByRole("button", { name: "Reemplazar" }),
    ).toBeInTheDocument();
  });
});
```

Consider renaming this file to `file-processing.test.tsx` in a follow-up, now that it no longer covers "document archive components" plural — out of scope for this task (keep the diff focused).

- [ ] **Step 6: Rewrite `DocumentPreview` in the route**

In `src/renderer/src/routes/app.$feature/preview.tsx`, replace the entire `DocumentPreview` function (lines 38-130) and its imports:
```tsx
import { FilePreview } from "@/components";
import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { useFileParse } from "@/hooks/useFileParse";
import { SectionTitle } from "@/layout/section-title";
import { removeAllFiles } from "@/reducers/file/actions";
import { Stack, styled, HStack } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { Button, Card } from "@aymurai/ui";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import VoicePreview from "@/components/voice-to-text/preview";

export const Route = createFileRoute("/app/$feature/preview")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({
    from: "/app/$feature/preview",
  });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoicePreview />;
  return <DocumentPreview />;
}

function DocumentPreview() {
  const { feature } = useParams({
    from: "/app/$feature/preview",
  });
  const navigate = useNavigate();
  const { t } = useTranslation(featureNamespace[feature]);

  const files = useFiles();
  const dispatch = useFileDispatch();
  const parseStatuses = useFileParse(files);
  const file = files[0];

  const isProcessing = Boolean(file && !file.paragraphs);

  const handleRemove = () => {
    dispatch(removeAllFiles());
    // RequireFile (wrapping this whole page) redirects to onboarding as soon
    // as files.length becomes 0 — no explicit navigation needed here.
  };

  const handleConfirmFiles = () => {
    navigate({
      to: "/app/$feature/process",
      params: { feature },
    });
  };

  return (
    <RequireFile>
      <Header title={t("title")} currentStep={1} feature={feature} />
      <MainContent>
        <Stack gap="8">
          <HStack alignItems="center" gap="6">
            <BackButton to="/app/$feature/onboarding" params={{ feature }} />
            <SectionTitle>{t("preview.sectionTitle")}</SectionTitle>
          </HStack>
          <Card>
            <Stack gap="8" alignItems="center">
              <styled.h2
                textStyle="subtitle.md.default"
                alignSelf="flex-start"
              >
                {t("preview.filesLabel")}
              </styled.h2>
              {file && (
                <FilePreview
                  file={file}
                  status={
                    parseStatuses[file.data.name]?.status ?? "processing"
                  }
                  onRemove={handleRemove}
                />
              )}
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <Button onClick={handleConfirmFiles} disabled={isProcessing}>
          {t("preview.continue")}
        </Button>
      </Footer>
    </RequireFile>
  );
}
```

Note what's deliberately gone: the `Grid` import/usage, the "Cargar más documentos" button and its `handleAddFiles`/`HiddenInput`/`inputRef` plumbing, and `filterUnselected` (nothing is ever unselected now — there's exactly zero or one file).

- [ ] **Step 7: Check whether `preview.filesLabel`/`preview.loadMore`/`preview.validFormats` i18n keys need cleanup**

Run: `grep -rn "preview.loadMore\|preview.validFormats" src/renderer/src/constants/i18n/`
If these keys are now unused anywhere (VTT's `preview.tsx` doesn't use them — confirm with `grep -rn "loadMore\|validFormats" src/renderer/src/components src/renderer/src/routes`), leave them in the locale files for this task (removing i18n keys is a separate cleanup, not required for correctness) — just confirm nothing still references them from code that would now be dead-import-broken.

- [ ] **Step 8: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors. Watch specifically for an unused `Grid` import or unused `filterUnselected`/`addFiles` imports left behind in `preview.tsx`.

- [ ] **Step 9: Run the full test suite**

Run: `pnpm test`
Expected: every test passes, including the three from this task's earlier steps and Task 8's `onboarding.test.tsx`.

- [ ] **Step 10: Visual smoke check — the full cycle**

Run `pnpm dev:web`. For both Dataset and Anonimizador: drop one file at onboarding → confirm the preview screen shows one large preview box (not a grid), a paragraph-count + size line, a trash icon; click trash → confirm you're bounced back to onboarding with the file gone (via `RequireFile`); drop a new file → confirm only that one shows (no leftover from before, Task 8's `removeAllFiles` guard). Then run the full cycle through to Procesamiento → Finalización, and repeat with a second file afterward to confirm you can go around the loop more than once.

- [ ] **Step 11: Commit**

```bash
git add src/renderer/src/components/file-preview/index.tsx src/renderer/src/components/file-preview/index.test.tsx src/renderer/src/components/document-archives.test.tsx src/renderer/src/routes/app.\$feature/preview.tsx
git commit -m "refactor(preview): rebuild dataset/anonimizador preview around a single document"
```

---

## Task 10: Anonimizador's Finalización header is missing its stepper

**Files:**
- Modify: `src/renderer/src/routes/app.$feature/finish.tsx:44`
- Test: Create `src/renderer/src/routes/app.$feature/finish.test.tsx`

**Interfaces:** None — pure bugfix, no signature changes.

**Context:** `DocumentFinish` (the component this line lives in) only ever renders for `Dataset` or `Anonymizer` — `RouteComponent` (lines 21-25) already branches `VoiceToText` off to `<VoiceFinish />` before `DocumentFinish` is reached at all. Line 44 nonetheless hardcodes the stepper to Dataset only:
```tsx
currentStep={feature === FeatureFlowEnum.Dataset ? 4 : undefined}
```
`Header`'s own logic (`@aymurai/ui`'s `AppHeader` wrapper, `src/renderer/src/components/layout/header.tsx:50-61`) only renders the 4-step stepper when `currentStep` is truthy — so Anonimizador's Finalización screen silently loses its stepper, while Dataset's keeps it. Both flows have the same 4 steps (`header.tsx:32-37` builds the same `steps` array for every non-VoiceToText feature) — there's no reason for the two to differ.

- [ ] **Step 1: Write the failing test first**

Create `src/renderer/src/routes/app.$feature/finish.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./finish";

vi.mock("@/hooks", () => ({ useFileDispatch: () => vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ feature: "ANONYMIZER" }),
  createFileRoute: () => (opts: unknown) => opts,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/finish/finish-anonymizer", () => ({
  default: () => null,
}));

describe("Finish route — stepper parity between Dataset and Anonimizador", () => {
  it("shows step 4 of 4 for Anonimizador, same as Dataset", () => {
    const RouteComponent = Route.options.component;
    render(<RouteComponent />);
    // AppHeader renders each step's number in a badge; step 4 being the
    // active one is rendered via the stepper prop, not a literal "4" text
    // node in every case, so assert on the concrete stepper item count
    // instead of guessing AppHeader's internal markup:
    expect(screen.getAllByText(/stepper\.(selection|extraction|validation|finalization)/).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/routes/app.\$feature/finish.test.tsx`
Expected: FAIL — with `feature: "ANONYMIZER"` mocked, `currentStep` evaluates to `undefined`, so `Header` takes the branch with no `steps`/`current` at all and none of the `stepper.*` keys render anywhere. Read the actual failure to confirm it's an absence-of-stepper failure, not a mocking mistake.

- [ ] **Step 3: Fix it**

In `src/renderer/src/routes/app.$feature/finish.tsx`, replace line 44:
```tsx
        currentStep={feature === FeatureFlowEnum.Dataset ? 4 : undefined}
```
with:
```tsx
        currentStep={4}
```

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/routes/app.\$feature/finish.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors. Note `FeatureFlowEnum` may now be unused in `finish.tsx` if this was its only reference in `DocumentFinish` — check with `grep -n "FeatureFlowEnum" src/renderer/src/routes/app.\$feature/finish.tsx` before removing the import; it's still used at line 23 (`feature === FeatureFlowEnum.VoiceToText`) and in the `Route`'s type params, so the import stays.

- [ ] **Step 6: Visual smoke check**

Run `pnpm dev:web` (or `pnpm dev`), complete an Anonimizador flow through to Finalización. Confirm the header now shows the same 4-step stepper with step 4 active, matching Dataset's Finalización screen.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/routes/app.\$feature/finish.tsx src/renderer/src/routes/app.\$feature/finish.test.tsx
git commit -m "fix(finish): show the stepper on anonimizador's finalización, matching dataset"
```

---

## Task 11: Dataset's Finalización crashes when the filesystem write fails

**Files:**
- Modify: `src/renderer/src/components/finish/finish-dataset.tsx:27-53`
- Test: Create `src/renderer/src/components/finish/finish-dataset.test.tsx`

**Interfaces:** None — internal error-handling fix, `FinishDatasetProps` (`{ onRestart: () => void }`) unchanged.

**Context:** The screenshots show two real console errors on Dataset's Finalización, both originating from `filesystemAPI()` (`src/renderer/src/services/filesystem/utils.ts:5-13`) throwing `'There was an error trying to use the "filesystem" API, check your preload script'` — which happens whenever `window.filesystem` isn't injected (e.g. testing via `pnpm dev:web`, a plain browser tab with no Electron preload; Dataset's offline persistence model — `utils/file/submitValidations/offline.ts` — reads/writes a local `.xlsx` workbook, which is only possible through Electron's preload bridge, never through a browser). **That specific throw is expected in web mode** — Dataset's local-dataset feature is Electron-only by design (`isOnline` is hardcoded to `false` in the call below; the "online" branch was never implemented — see the comment in `submitValidations/index.ts:19`). That part isn't a bug to fix here.

The real bug is in `finish-dataset.tsx` itself, regardless of *why* the filesystem call fails — even inside a real Electron build, a disk error, a permissions issue, or a corrupted workbook would trigger the exact same broken behavior:

```tsx
const submit = async (file: DocFile) => {
  try {
    await submitValidations({ isOnline: false, validations: file.validationObject });
  } catch {
    setErrorNames((names) => [...names, file.data.name]);
  }

  // Export the feedback JSON
  await filesystem.feedback.export(files);       // <-- not inside the try/catch at all
};

useEffect(() => {
  const submitAll = async () => {
    for (const file of files) {
      await submit(file);                         // <-- one rejection here stops the whole loop
    }
  };
  submitAll().then(() => setIsLoading(false));     // <-- .then with no rejection handler: if submitAll
                                                    //     rejects, isLoading is stuck at `true` forever
}, []);
```

Two independent problems: (1) `filesystem.feedback.export(files)` has no error handling at all, so if it throws, the `AbortError`-flavored rejection propagates all the way up uncaught, exactly as seen in the second console error (`export.ts:15:11` → `submit` → `submitAll`); (2) `submitAll().then(() => setIsLoading(false))` has no rejection branch, so that same uncaught rejection also means `setIsLoading(false)` never runs — the screen is stuck showing a loading spinner forever on top of the uncaught error, instead of showing the error state cleanly.

- [ ] **Step 1: Write the failing test first**

Create `src/renderer/src/components/finish/finish-dataset.test.tsx`:
```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import FinishDataset from "./finish-dataset";

const files = [
  { data: new File(["a"], "a.docx"), selected: true, validationObject: {} },
];
vi.mock("@/hooks/useFiles", () => ({ useFiles: () => files }));

const submitValidations = vi.fn().mockResolvedValue(undefined);
vi.mock("@/utils/file", () => ({ submitValidations }));

const exportFeedback = vi.fn();
vi.mock("@/services/filesystem", () => ({
  default: {
    feedback: { export: (...args: unknown[]) => exportFeedback(...args) },
    excel: { open: vi.fn() },
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("FinishDataset — resilience to filesystem failures", () => {
  beforeEach(() => {
    submitValidations.mockClear();
    exportFeedback.mockClear();
  });

  it("stops showing the loading state even when the feedback export throws", async () => {
    exportFeedback.mockRejectedValue(new Error("no filesystem API"));
    render(<FinishDataset onRestart={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("a.docx")).toBeInTheDocument();
    });
    // The file itself submitted fine — only the export step failed — so it
    // should NOT be reported as an error file, but the screen must still
    // leave the loading state instead of hanging indefinitely.
    expect(exportFeedback).toHaveBeenCalledOnce();
  });

  it("marks the file as errored, and still calls export, when submitValidations rejects", async () => {
    submitValidations.mockRejectedValue(new Error("write failed"));
    render(<FinishDataset onRestart={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Error de guardado/)).toBeInTheDocument();
    });
    expect(exportFeedback).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/finish/finish-dataset.test.tsx`
Expected: FAIL on the first test — `exportFeedback`'s rejection is unhandled, so the `useEffect`'s `submitAll().then(...)` never resolves `isLoading`, and the component stays stuck rendering `isLoading` (check `FileCheck`'s loading UI to see what assertion actually fails — regardless, confirm you see a real failure, e.g. a timeout from `waitFor`, not a mocking error).

- [ ] **Step 3: Fix `finish-dataset.tsx`**

Replace the `submit`/`useEffect` block:
```tsx
  const submit = async (file: DocFile) => {
    let hasError = false;
    try {
      // POST the validated data to the dataset
      await submitValidations({
        isOnline: false,
        validations: file.validationObject,
      });
    } catch {
      hasError = true;
      setErrorNames((names) => [...names, file.data.name]);
    }

    try {
      // Export the feedback JSON
      await filesystem.feedback.export(files);
    } catch (error) {
      console.error("Failed to export feedback JSON:", error);
      if (!hasError) setErrorNames((names) => [...names, file.data.name]);
    }
  };

  // At first render, submit all the data
  useEffect(() => {
    const submitAll = async () => {
      for (const file of files) {
        await submit(file);
      }
    };

    submitAll()
      .catch((error) => {
        console.error("Failed to submit dataset validations:", error);
      })
      .finally(() => setIsLoading(false));

    // We strictly need to run this effect once
  }, []);
```

This guarantees `isLoading` always resolves to `false` (via `.finally`) regardless of which step failed, and both filesystem calls are now individually caught and reflected in `errorNames` instead of one of them escaping as an uncaught rejection.

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/components/finish/finish-dataset.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 6: Visual smoke check**

Run `pnpm dev` (real Electron shell, so the filesystem preload actually exists) and complete a Dataset flow through Finalización — confirm no console errors and the "Ver set de datos" button becomes usable once loading finishes. Then run the same flow via `pnpm dev:web` — confirm the screen still leaves the loading state and shows `FileCheck`'s error state cleanly (no uncaught rejection in the console), since a browser tab genuinely has no filesystem access to give it.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/finish/finish-dataset.tsx src/renderer/src/components/finish/finish-dataset.test.tsx
git commit -m "fix(finish): stop the dataset finalización screen from hanging when the filesystem write fails"
```

---

## Task 12: Validation-step footer is missing "Plataforma hecha por Datagénero" on Dataset and Anonimizador

**Files:**
- Modify: `src/renderer/src/routes/app.$feature/validation.tsx:59` (Anonimizador)
- Modify: `src/renderer/src/components/validate-dataset/index.tsx:104` (Dataset)
- Test: Create `src/renderer/src/components/validate-dataset/index.test.tsx`, extend/create `src/renderer/src/routes/app.$feature/validation.test.tsx`

**Interfaces:** None — both call sites already accept `Footer`'s existing `withBuiltBy` prop (Task 4 keeps that prop shape unchanged); this only flips it on.

**Context:** Every other screen in the Dataset/Anonimizador flows (`onboarding.tsx`, `preview.tsx`, `process.tsx`, `finish.tsx` — via `FinishDataset`/`FinishAnonymizer`) renders `<Footer withBuiltBy>`. The validation step is the one exception for both flows: Anonimizador's `<Footer>` (`routes/app.$feature/validation.tsx:59`) and Dataset's `<Footer>` (`components/validate-dataset/index.tsx:104`) are both bare, so the DataGénero credit disappears for one step and reappears on the next. Voz a Texto's validation step is correctly excluded from this fix — its footer-equivalent (`TranscriptionEditor`'s `footerActions` slot) is dominated by the audio player/transcript editor UI, where there's no room for it and no other VTT screen's footer pattern applies.

- [ ] **Step 1: Write the failing tests first**

Create `src/renderer/src/components/validate-dataset/index.test.tsx` (adjust the mocks below to whatever this component's real dependencies turn out to require once you read the full file — it's long; the sketch below covers the footer assertion, which is all this task needs):
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ValidateDataset from "./index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("ValidateDataset footer", () => {
  it("shows the DataGénero credit, like every other dataset screen", () => {
    render(<ValidateDataset />);
    expect(screen.getByText("platformBuiltBy")).toBeInTheDocument();
  });
});
```

Create/extend `src/renderer/src/routes/app.$feature/validation.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./validation";

vi.mock("@/hooks", () => ({ useFiles: () => [{ data: new File(["x"], "a.docx") }] }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ feature: "ANONYMIZER" }),
  createFileRoute: () => (opts: unknown) => opts,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components", () => ({
  FileAnnotator: () => null,
  ValidateDataset: () => null,
}));

describe("Anonimizador validation footer", () => {
  it("shows the DataGénero credit, like every other anonimizador screen", () => {
    const RouteComponent = Route.options.component;
    render(<RouteComponent />);
    expect(screen.getByText("platformBuiltBy")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run both, confirm they fail**

Run: `pnpm test src/renderer/src/components/validate-dataset/index.test.tsx src/renderer/src/routes/app.\$feature/validation.test.tsx`
Expected: FAIL on both — neither `<Footer>` passes `withBuiltBy` today, so `platformBuiltBy` never renders. If the `ValidateDataset` test instead fails on an unrelated missing mock (this component has more dependencies than just i18n — read `src/renderer/src/components/validate-dataset/index.tsx` in full before running, and add whatever else it needs mocked, e.g. file/reducer hooks), fix the mocks until the failure is specifically about the missing footer text, not a crash.

- [ ] **Step 3: Add `withBuiltBy` to both**

In `src/renderer/src/components/validate-dataset/index.tsx:104`:
```tsx
      <Footer withBuiltBy>
```

In `src/renderer/src/routes/app.$feature/validation.tsx:59`:
```tsx
        <Footer withBuiltBy>
```

- [ ] **Step 4: Run both tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/validate-dataset/index.test.tsx src/renderer/src/routes/app.\$feature/validation.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 6: Visual smoke check**

Run `pnpm dev:web`, go through Dataset's validation step and Anonimizador's validation step — confirm "Plataforma hecha por" + the DataGénero logo now show on both, consistent with every other screen in each flow. Then check Voz a Texto's validation step is unaffected (still no BuiltBy, player/editor still fills that space).

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/validate-dataset/index.tsx src/renderer/src/components/validate-dataset/index.test.tsx src/renderer/src/routes/app.\$feature/validation.tsx src/renderer/src/routes/app.\$feature/validation.test.tsx
git commit -m "fix(validation): show the datagénero credit on dataset and anonimizador validation footers"
```

---

## Explicitly out of scope

- **`FileCheck` → `ArchiveView type="document-ok"/"document-error"`.** `ArchiveView` already had these two types before v0.5.0 (nothing changed about them this release) — `file-check/index.tsx`, `ErrorText.ts`, and `FileCheck.styles.ts` still run on the legacy `stitches` styling system (not Panda), used only on the Finalización screens (`finish-dataset.tsx`, `finish-anonymizer.tsx`). Migrating it is a real but separate legacy-cleanup task, unrelated to anything that changed in this v0.5.0 release — flagged for its own plan if wanted.
- **`package.json`/`pnpm-lock.yaml` version bump.** Stays on `github:AymurAI/ui-components#v0.4.3` until the real tag/publish happens (Fase 8 of the `ui-components` release plan) — the live symlink makes that safe to defer.
- **VTT (Voz a Texto) file selection.** "Un documento por vez" is scoped to the docx/pdf flows (Dataset, Anonimizador) per product decision — VTT's own multi-file audio list (`voice-to-text/preview.tsx`) is untouched beyond Task 7's `ArchiveRow` swap.
- **Making Dataset's offline persistence work in a plain browser tab.** Task 11 only fixes `finish-dataset.tsx`'s error handling (no more hang, no more uncaught rejection) — it does **not** make `pnpm dev:web` able to read/write a local `.xlsx` file, which is fundamentally impossible without Electron's filesystem preload bridge. Testing Task 11's happy path requires `pnpm dev` (real Electron shell); `pnpm dev:web` will still show the (now-clean) error state for Dataset's Finalización, by design.

## Self-Review

- **Spec coverage:** All 9 gaps identified in the audit (Dialog×2, SidePanel, AppFooter, FeaturesMenu, Tutorial, ArchiveRow, single-file enforcement, preview redesign) plus the 3 bugs reported afterward (missing stepper on Anonimizador's Finalización, `finish-dataset` hang/uncaught rejection, missing DataGénero credit on Dataset/Anonimizador's validation footer) each have a task. `ArchiveProgress`, `Callout` compact, `FileDropZone`, `Toolbar` were confirmed already live on `feature/ui-components-app-wide` and correctly excluded.
- **Placeholder scan:** no TBD/"add tests"/"similar to Task N" — every step has real code or an exact command with an expected result.
- **Type consistency:** `FilePreview`'s new `onRemove` prop (Task 9, Step 3) matches its call site in the rewritten `DocumentPreview` (Task 9, Step 6). `Footer`'s prop shape (Task 4) is unchanged, verified against all 9 call sites via the "Produces" note (corrected from an earlier miscount of 6). `FeaturesMenu`'s external `{ trigger? }` shape (Task 5) matches `layout/header.tsx:47`'s existing call. Task 11 keeps `submit()`'s existing `errorNames`/`isLoading` state shape — `FinishDataset`'s render (unchanged) still reads both the same way. Task 12 only touches two of Task 4's 9 `Footer` call sites, and only adds a prop Task 4 already defined — no conflict between the two tasks regardless of execution order. Task 9 imports `formatFileSize` from Task 7 — this is the one real ordering dependency in the plan (noted in both tasks' "Interfaces"/"Consumes"); every other task is order-independent.
