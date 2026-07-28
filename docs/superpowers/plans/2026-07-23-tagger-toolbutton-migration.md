# Tagger ToolButton Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Anonymizer entity-edit toolbar's (`components/file/annotation-popover/`) hand-rolled `<img>`-based icon buttons with `@aymurai/ui`'s `ToolButton` component, removing the now-redundant local SVG assets.

**Architecture:** `ToolButton`'s six actions (`reemplazar`/`reemplazar-todo`/`eliminar`/`eliminar-todo`/`agregar-etiqueta`/`agregar-todas`) were built from the exact same Figma family this toolbar already implements by hand — the local `public/button-icons/*.svg` assets are pixel-accurate copies of the same Figma vectors `ToolButton` renders. `ToolButton` needs one small, additive API change first (letting a consumer override its default `aria-label`/`title`, since this toolbar's tooltips use more contextual copy — "Afectar una ocurrencia" — than `ToolButton`'s generic per-action labels — "Agregar etiqueta"). Then `tagger-button.tsx` is rewritten to wrap `ToolButton` instead of a raw `<button><img></button>`, keeping its existing `Tooltip` composition and richer copy untouched. `tagger.tsx` swaps each `<TaggerButton><img/></TaggerButton>` call for `<TaggerButton action="..." tooltip="...">`, and the four now-unused local SVGs are deleted.

**Tech Stack:** React 19, TypeScript, Panda CSS, Radix UI (via `@aymurai/ui`), Vitest + React Testing Library.

## Global Constraints

- Package manager is pnpm in both repos; do not run `npm install`.
- `desktop-app` consumes `@aymurai/ui` live via a manual symlink (`node_modules/@aymurai/ui` → the sibling `ui-components` checkout) — after Task 1 changes `ui-components` source, run `cd ../ui-components && pnpm build` (`vite build && panda cssgen --silent --outfile dist/styles.css && cp src/styles/fonts.css dist/fonts.css`) before starting Task 2, or `desktop-app` will keep resolving the old, un-overridable `ToolButton`.
- **Known environment issue in `desktop-app`, not a code defect:** `pnpm test` fails on a clean baseline for any test rendering an `@aymurai/ui` component (a duplicate-React artifact from the manual symlink — stack traces mention `ui-components/node_modules/.pnpm/react@...`, errors read `Cannot read properties of null (reading 'useState'/'useContext'/etc.)`). Any test in this plan that renders `ToolButton`/`Tooltip` may hit this. Treat ONLY that exact failure signature as expected noise — trace test assertions by hand to confirm they'd pass in a working environment; do not skip verification just because the suite can't run green here. `ui-components`' own tests (Task 1) are pure component tests with no such symlink issue and must actually pass.
- Radix primitives come from `@aymurai/ui`, never `@radix-ui/*` directly (already followed by the existing code — don't introduce a direct import).
- Panda `strictTokens: true` in both repos — any arbitrary value needs the `[bracket]` escape.
- No `forwardRef` — React 19 ref-as-prop convention.
- `ToolButtonAction`'s six string values (`"reemplazar" | "reemplazar-todo" | "eliminar" | "eliminar-todo" | "agregar-etiqueta" | "agregar-todas"`) are the only valid values for the `action` prop threaded through every task below — don't invent new ones.

---

## Task 1: `ToolButton` — let a consumer override the default `aria-label`/`title`

**Repo:** `ui-components`

**Files:**
- Modify: `src/components/tool-button/ToolButton.tsx`
- Create: `src/components/tool-button/ToolButton.test.tsx`

**Interfaces:**
- Produces: `ToolButton`'s `aria-label`/`title` props (already part of `ButtonHTMLAttributes<HTMLButtonElement>`, hence already part of `ToolButtonProps`) now take precedence over the built-in `ACTION_LABELS[action]` default when explicitly passed. No prop name or type changes — purely a precedence fix.

**Context:** `ToolButton` currently spreads `{...props}` and THEN sets `aria-label={label}`/`title={label}` afterward, so any `aria-label`/`title` a consumer passes is silently overwritten by the generic per-action Spanish label. Task 2 needs to pass the Anonymizer toolbar's own richer tooltip copy ("Afectar una ocurrencia") as the button's accessible name instead of the generic default ("Agregar etiqueta") — this task makes that possible without touching `ToolButtonAction`/`ACTION_LABELS` at all.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/tool-button/ToolButton.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolButton } from "./ToolButton";

describe("ToolButton", () => {
  it("uses the action's default label as aria-label and title when none is passed", () => {
    render(<ToolButton action="agregar-etiqueta" />);
    const button = screen.getByRole("button", { name: "Agregar etiqueta" });
    expect(button).toHaveAttribute("title", "Agregar etiqueta");
  });

  it("lets a consumer override aria-label and title", () => {
    render(
      <ToolButton
        action="agregar-etiqueta"
        aria-label="Afectar una ocurrencia"
        title="Afectar una ocurrencia"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).toHaveAttribute("title", "Afectar una ocurrencia");
    expect(
      screen.queryByRole("button", { name: "Agregar etiqueta" }),
    ).not.toBeInTheDocument();
  });

  it("still forwards onClick and disabled when aria-label is overridden", () => {
    const onClick = vi.fn();
    render(
      <ToolButton
        action="eliminar"
        aria-label="Eliminar esta ocurrencia"
        onClick={onClick}
        disabled
      />,
    );
    const button = screen.getByRole("button", {
      name: "Eliminar esta ocurrencia",
    });
    expect(button).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `cd ui-components && export PATH="$PWD/node_modules/.bin:$PATH" && vitest run src/components/tool-button/ToolButton.test.tsx`
Expected: FAIL — the override test fails because `aria-label={label}` currently runs after `{...props}` and always wins.

- [ ] **Step 3: Fix the precedence**

In `src/components/tool-button/ToolButton.tsx`, replace:

```tsx
export function ToolButton({
  action,
  className,
  type = "button",
  ...props
}: ToolButtonProps) {
  const label = ACTION_LABELS[action];
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={label}
      className={cx(toolButton(), className)}
    >
      <ActionIcon action={action} />
    </button>
  );
}
```

with:

```tsx
export function ToolButton({
  action,
  className,
  type = "button",
  "aria-label": ariaLabel,
  title,
  ...props
}: ToolButtonProps) {
  const label = ACTION_LABELS[action];
  return (
    <button
      {...props}
      type={type}
      aria-label={ariaLabel ?? label}
      title={title ?? label}
      className={cx(toolButton(), className)}
    >
      <ActionIcon action={action} />
    </button>
  );
}
```

- [ ] **Step 4: Run the tests again, confirm they pass**

Run: `export PATH="$PWD/node_modules/.bin:$PATH" && vitest run src/components/tool-button/ToolButton.test.tsx`
Expected: PASS, all 3 cases green.

- [ ] **Step 5: Typecheck, lint, rebuild**

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
tsc -p tsconfig.build.json --noEmit
biome check src/components/tool-button/ToolButton.tsx src/components/tool-button/ToolButton.test.tsx
vite build
panda cssgen --silent --outfile dist/styles.css
cp src/styles/fonts.css dist/fonts.css
```

Expected: all clean. The rebuild is required — `desktop-app` (Task 2 onward) resolves `@aymurai/ui` from this repo's `dist/`, not its `src/`.

- [ ] **Step 6: Commit**

```bash
cd ui-components
git add src/components/tool-button/ToolButton.tsx src/components/tool-button/ToolButton.test.tsx
git commit -m "feat(tool-button): let a consumer override the default aria-label/title"
```

---

## Task 2: Rewrite `TaggerButton` to wrap `ToolButton`

**Repo:** `desktop-app`

**Files:**
- Modify: `src/renderer/src/components/file/annotation-popover/tagger-button.tsx`
- Create: `src/renderer/src/components/file/annotation-popover/tagger-button.test.tsx`

**Interfaces:**
- Consumes: `ToolButton`, `ToolButtonAction` (type), `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` — all from `@aymurai/ui` (requires Task 1's rebuilt `dist`).
- Produces: `TaggerButton` component with props `{ action: ToolButtonAction; tooltip: string; onClick: () => void; disabled?: boolean }` — replacing its previous `{ tooltip: string; children: ReactNode; onClick: () => void; disabled?: boolean }` shape. Task 3 is the only consumer and is updated in lockstep.

**Context:** The current `TaggerButton` renders a bare `<button>` styled via a local `sva`, with the caller supplying an `<img>` as `children`. This task swaps the internals to render `ToolButton` (which owns its own icon, sizing, and hover/pressed/disabled states) while keeping the exact same `Tooltip`/`TooltipContent` composition and copy — so `TaggerButton`'s public contract changes from "pass me an icon" to "pass me an action name", but its tooltip behavior is unchanged.

- [ ] **Step 1: Write the failing test**

```tsx
// src/renderer/src/components/file/annotation-popover/tagger-button.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaggerButton from "./tagger-button";

describe("TaggerButton", () => {
  it("renders the ToolButton for the given action, labeled with the tooltip text", () => {
    render(
      <TaggerButton
        action="agregar-etiqueta"
        tooltip="Afectar una ocurrencia"
        onClick={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when enabled and clicked", () => {
    const onClick = vi.fn();
    render(
      <TaggerButton
        action="agregar-todas"
        tooltip="Afectar todas las ocurrencias"
        onClick={onClick}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Afectar todas las ocurrencias" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <TaggerButton
        action="agregar-etiqueta"
        tooltip="Afectar una ocurrencia"
        onClick={onClick}
        disabled
      />,
    );
    const button = screen.getByRole("button", {
      name: "Afectar una ocurrencia",
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows the tooltip content on hover", async () => {
    render(
      <TaggerButton
        action="eliminar"
        tooltip="Eliminar esta ocurrencia"
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button", {
      name: "Eliminar esta ocurrencia",
    });
    // The button's own accessible name comes from its `aria-label` attribute,
    // not visible text — only the Tooltip's content panel renders the copy
    // as actual text once opened, so this should find exactly one match.
    fireEvent.mouseEnter(button);
    await waitFor(() => {
      expect(screen.getByText("Eliminar esta ocurrencia")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/file/annotation-popover/tagger-button.test.tsx`
Expected: FAIL — either the current `tagger-button.tsx` still requires a `children` prop (missing `action`/type error) or, if it happens to render, hits the known dual-React noise. Confirm the failure is a real assertion mismatch (component doesn't accept `action` yet), not just the environment issue, before proceeding — read the actual error.

- [ ] **Step 3: Rewrite `tagger-button.tsx`**

Replace the entire contents of `src/renderer/src/components/file/annotation-popover/tagger-button.tsx`:

```tsx
import { css } from "@/styled/css";
import { styled } from "@/styled/jsx";
import {
  ToolButton,
  type ToolButtonAction,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@aymurai/ui";

const tooltipContent = css({
  bg: "action.hover",
  color: "white",
  px: "1",
  py: "0.5",
  rounded: "sm",
});

interface TaggerButtonProps {
  action: ToolButtonAction;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}
export default function TaggerButton({
  action,
  tooltip,
  onClick,
  disabled = false,
}: TaggerButtonProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolButton
            action={action}
            aria-label={tooltip}
            title={tooltip}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            aria-disabled={disabled}
          />
        </TooltipTrigger>
        <TooltipContent showArrow={false} sideOffset={12}>
          <div className={tooltipContent}>
            <styled.p textStyle="label.sm.default">{tooltip}</styled.p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 4: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/file/annotation-popover/tagger-button.test.tsx`
Expected: PASS. If any case instead fails with the documented dual-React signature (`Cannot read properties of null`, stack mentioning `ui-components/node_modules/.pnpm/react@...`), trace the assertion by hand against the code above and record that in place of a green run — don't silently skip verification.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors in the two touched files (pre-existing, unrelated errors elsewhere are expected per the documented environment issue).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/file/annotation-popover/tagger-button.tsx src/renderer/src/components/file/annotation-popover/tagger-button.test.tsx
git commit -m "refactor(annotation-popover): rebuild TaggerButton on @aymurai/ui's ToolButton"
```

---

## Task 3: Wire `Tagger` to the action-based `TaggerButton`, delete the orphaned icon assets

**Repo:** `desktop-app`

**Files:**
- Modify: `src/renderer/src/components/file/annotation-popover/tagger.tsx`
- Create: `src/renderer/src/components/file/annotation-popover/tagger.test.tsx`
- Delete: `src/renderer/public/button-icons/add-one.svg`
- Delete: `src/renderer/public/button-icons/add-all.svg`
- Delete: `src/renderer/public/button-icons/delete-one.svg`
- Delete: `src/renderer/public/button-icons/delete-all.svg`

**Interfaces:**
- Consumes: Task 2's `TaggerButton` (`{ action, tooltip, onClick, disabled? }`).
- Produces: no change to `Tagger`'s own public props (`MarkTaggerProps`, already `{ onClickOne, onClickAll, onDeleteOne?, onDeleteAll? }`) — this task only changes what's inside the component.

**Context:** `Tagger` currently passes an `<img src=".../add-one.svg">` as each `TaggerButton`'s `children`. Since `TaggerButton` no longer accepts `children` (Task 2), every call site swaps to the matching `action` value. The local `IMG_SIZE` constant and the now-fully-unused `button` slot in this file's `sva` (it was never applied to any element even before this change — confirm via the current file) are dropped. The four SVG files under `public/button-icons/` become unreferenced anywhere in the codebase once this lands (verified via `grep -rn "button-icons" src/renderer/src` returning nothing) and are deleted.

- [ ] **Step 1: Confirm no other consumer of the SVG assets exists**

Run: `grep -rn "button-icons" src/renderer/src`
Expected (before this task's changes): 4 hits, all in `tagger.tsx` (the ones this task is about to remove). If this returns any hit outside `tagger.tsx`, STOP — something else depends on these assets and they should not be deleted; escalate instead of deleting.

- [ ] **Step 2: Write the failing test**

```tsx
// src/renderer/src/components/file/annotation-popover/tagger.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Tagger from "./tagger";

// null: every test in this file starts with no label pre-selected, matching
// the "disabled until a label is chosen" and "select then click" scenarios
// below. Nothing in this file needs a pre-selected label.
const mockLabel: string | null = null;
vi.mock("@/context/Annotation", () => ({
  useAnnotation: () => ({ label: mockLabel }),
}));

vi.mock("@/store/useLocal", () => ({
  useExcludedTagsConfig: () => ({ tags: [] }),
}));

vi.mock("@/utils/anonymizer/labels", () => ({
  getActiveAnonymizerLabelOptions: () => [
    { id: "PERSONA", text: "Persona" },
    { id: "LUGAR", text: "Lugar" },
  ],
}));

vi.mock("@/components/anonymizer/anonymizer-label-select", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (option: { id: string; text: string }) => void;
  }) => (
    <select
      aria-label="Etiqueta"
      value={value ?? ""}
      onChange={(e) => onChange({ id: e.target.value, text: e.target.value })}
    >
      <option value="">--</option>
      <option value="PERSONA">Persona</option>
      <option value="LUGAR">Lugar</option>
    </select>
  ),
}));

describe("Tagger", () => {
  it("renders only the add-one/add-all buttons when no delete handlers are passed", () => {
    render(<Tagger onClickOne={vi.fn()} onClickAll={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Afectar todas las ocurrencias" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar esta ocurrencia" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar todas las ocurrencias" }),
    ).not.toBeInTheDocument();
  });

  it("renders the delete buttons when their handlers are passed", () => {
    render(
      <Tagger
        onClickOne={vi.fn()}
        onClickAll={vi.fn()}
        onDeleteOne={vi.fn()}
        onDeleteAll={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Eliminar esta ocurrencia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eliminar todas las ocurrencias" }),
    ).toBeInTheDocument();
  });

  it("disables add-one/add-all until a label is selected, and enables them once one is", () => {
    render(<Tagger onClickOne={vi.fn()} onClickAll={vi.fn()} />);
    const addOne = screen.getByRole("button", {
      name: "Afectar una ocurrencia",
    });
    expect(addOne).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Etiqueta"), {
      target: { value: "LUGAR" },
    });

    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).not.toBeDisabled();
  });

  it("calls onClickOne/onClickAll with the selected label", () => {
    const onClickOne = vi.fn();
    const onClickAll = vi.fn();
    render(<Tagger onClickOne={onClickOne} onClickAll={onClickAll} />);

    fireEvent.change(screen.getByLabelText("Etiqueta"), {
      target: { value: "LUGAR" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    );
    expect(onClickOne).toHaveBeenCalledWith("LUGAR");

    fireEvent.click(
      screen.getByRole("button", { name: "Afectar todas las ocurrencias" }),
    );
    expect(onClickAll).toHaveBeenCalledWith("LUGAR");
  });

  it("calls onDeleteOne/onDeleteAll directly, with no label required", () => {
    const onDeleteOne = vi.fn();
    const onDeleteAll = vi.fn();
    render(
      <Tagger
        onClickOne={vi.fn()}
        onClickAll={vi.fn()}
        onDeleteOne={onDeleteOne}
        onDeleteAll={onDeleteAll}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar esta ocurrencia" }),
    );
    expect(onDeleteOne).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar todas las ocurrencias" }),
    );
    expect(onDeleteAll).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/file/annotation-popover/tagger.test.tsx`
Expected: FAIL — the current `tagger.tsx` still renders `<TaggerButton><img .../></TaggerButton>` with no `action` prop, so `TaggerButton` (already rewritten in Task 2 to require `action`) receives an invalid/missing prop and the buttons don't render with the expected accessible names.

- [ ] **Step 4: Rewrite `tagger.tsx`**

Replace the entire contents of `src/renderer/src/components/file/annotation-popover/tagger.tsx`:

```tsx
import { useState } from "react";

import { sva } from "@/styled/css";
import { styled } from "@/styled/jsx";
import { hstack } from "@/styled/patterns";

import AnonymizerLabelSelect from "@/components/anonymizer/anonymizer-label-select";
import { useAnnotation } from "@/context/Annotation";
import { useExcludedTagsConfig } from "@/store/useLocal";
import type { AllLabels } from "@/types/aymurai";
import type { SelectOption } from "@/types/select";
import { getActiveAnonymizerLabelOptions } from "@/utils/anonymizer/labels";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@aymurai/ui";

import TaggerButton from "./tagger-button";

const tagger = sva({
  slots: ["container", "divider", "tooltipContent"],
  base: {
    container: {
      ...hstack.raw({ alignItems: "center", gap: "1" }),
      // Figma "Tool Bar" (node 40000696:77073): p-[8px], rounded-[8px], plus
      // the "M3/Elevation Light/1" two-layer shadow — verified against the
      // literal exported CSS, not the design-context tool's drop-shadow-[...]
      // utility (which had mis-converted blur radii and dropped the spread).
      p: "2",
      bg: "action.alt-default",
      rounded: "md",
      boxShadow:
        "[0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)]",
    },
    divider: {
      alignSelf: "stretch",
      width: "[1px]",
      bg: "[#5960B0]",

      my: "1",
    },
    tooltipContent: {
      bg: "action.hover",
      color: "white",
      px: "1",
      py: "0.5",
      rounded: "sm",
    },
  },
});

interface MarkTaggerProps {
  onClickOne: (label: AllLabels) => void;
  onClickAll: (label: AllLabels) => void;
  onDeleteOne?: () => void;
  onDeleteAll?: () => void;
}
export default function Tagger({
  onClickAll,
  onClickOne,
  onDeleteOne,
  onDeleteAll,
}: MarkTaggerProps) {
  const { label: initialLabel } = useAnnotation();
  const { tags } = useExcludedTagsConfig();

  const [label, setLabel] = useState<AllLabels | null>(initialLabel);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const options = getActiveAnonymizerLabelOptions(tags);
  const activeLabel =
    label && options.some((option) => option.id === label) ? label : null;

  const handleClickOne = () => {
    if (!activeLabel) return;
    onClickOne(activeLabel);
  };
  const handleClickAll = () => {
    if (!activeLabel) return;
    onClickAll(activeLabel);
  };

  const handleLabelChange = (value: SelectOption) => {
    setLabel(value.id as AllLabels);
  };

  const classes = tagger();
  return (
    <div className={classes.container}>
      <TooltipProvider delayDuration={0}>
        <Tooltip open={isSelectOpen ? false : undefined}>
          <TooltipTrigger asChild>
            <div>
              <AnonymizerLabelSelect
                placeholder="Etiqueta"
                size="sm"
                value={activeLabel ?? undefined}
                options={options}
                onChange={handleLabelChange}
                onOpenChange={setIsSelectOpen}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent showArrow={false} sideOffset={12}>
            <div className={classes.tooltipContent}>
              <styled.p textStyle="label.sm.default">
                Selecciona tipo de etiqueta
              </styled.p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className={classes.divider} />
      <TaggerButton
        action="agregar-etiqueta"
        tooltip="Afectar una ocurrencia"
        onClick={handleClickOne}
        disabled={!activeLabel}
      />
      <div className={classes.divider} />
      <TaggerButton
        action="agregar-todas"
        tooltip="Afectar todas las ocurrencias"
        onClick={handleClickAll}
        disabled={!activeLabel}
      />
      {onDeleteOne && (
        <>
          <div className={classes.divider} />
          <TaggerButton
            action="eliminar"
            tooltip="Eliminar esta ocurrencia"
            onClick={onDeleteOne}
          />
        </>
      )}
      {onDeleteAll && (
        <>
          <div className={classes.divider} />
          <TaggerButton
            action="eliminar-todo"
            tooltip="Eliminar todas las ocurrencias"
            onClick={onDeleteAll}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/file/annotation-popover/tagger.test.tsx`
Expected: PASS. As in Task 2, if a case hits the documented dual-React environment signature instead of a real assertion failure, hand-trace it against the code above rather than skipping verification.

- [ ] **Step 6: Delete the now-orphaned SVG assets**

```bash
grep -rn "button-icons" src/renderer/src
```
Expected: no output (confirms nothing references them anymore).

```bash
rm src/renderer/public/button-icons/add-one.svg
rm src/renderer/public/button-icons/add-all.svg
rm src/renderer/public/button-icons/delete-one.svg
rm src/renderer/public/button-icons/delete-all.svg
```

If `src/renderer/public/button-icons/` is now empty, remove the directory too:

```bash
rmdir src/renderer/public/button-icons 2>/dev/null || true
```

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors in the touched files.

- [ ] **Step 8: Visual smoke check**

Run `pnpm dev:web`, open the Anonimizador flow, select some text to tag, open the entity-edit popover. Confirm: the toolbar shows the tag-select dropdown, a divider, the "add one"/"add all" buttons (disabled until a label is chosen), and — when editing an existing tag — the delete-one/delete-all buttons too. Hover each icon button and confirm the same tooltip copy as before ("Afectar una ocurrencia", etc.) still appears, and that the container's rounded corners/shadow/padding match the earlier fix (8px radius, 8px padding, visible elevation shadow).

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/components/file/annotation-popover/tagger.tsx src/renderer/src/components/file/annotation-popover/tagger.test.tsx
git rm src/renderer/public/button-icons/add-one.svg src/renderer/public/button-icons/add-all.svg src/renderer/public/button-icons/delete-one.svg src/renderer/public/button-icons/delete-all.svg
git commit -m "refactor(annotation-popover): consume ToolButton actions in Tagger, drop local icon assets"
```
