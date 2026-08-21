import { FileAnnotatorFixture } from "@/test/playwright-fixtures/file-annotator-fixture";
import { TranscriptionEditorFixture } from "@/test/playwright-fixtures/transcription-editor-fixture";
import { ValidateDatasetFixture } from "@/test/playwright-fixtures/validate-dataset-fixture";
import { test } from "@playwright/experimental-ct-react";
import { expectHitTestable } from "./hit-test";

/**
 * G1 criterion 1 (tasks/responsive-fixes/issues/G1-paneles-laterales.md,
 * Issues 04/11): below `lg` (768) the side panel used to be a silent
 * `position: absolute` overlay with no backdrop, covering the
 * toolbar/header controls of all three validation screens with nothing
 * underneath ever moving out of the way. T1 fixed the layout (stacked
 * panel, see side-panel-column.tsx's docblock); this spec is the
 * regression guard that a real click would actually land on the control
 * instead of the panel sitting on top of it.
 *
 * `expect.soft` isn't used here: a covered control is the exact defect
 * this spec exists to catch, so a single failure should stop the test
 * loudly rather than let the run continue past a broken UI.
 */

test("Anonimizador: toolbar controls are hit-testable with the entities panel open", async ({
  mount,
}) => {
  const component = await mount(<FileAnnotatorFixture />);

  // Sourced from i18next as of G3 issue 05 (constants/i18n/locales/es/
  // anonymizer.ts's `searchBar.searchAriaLabel` key, via SearchBar/index.tsx's
  // `useTranslation("anonymizer")`), same Spanish copy as before the
  // migration.
  const search = component.getByRole("searchbox", {
    name: "Buscar en el documento",
  });
  await expectHitTestable(search, "Anonimizador: search input");

  // G3 issue 05 removed the embedded newline this label used to render
  // (`SearchBar/index.tsx` used to hard-code `Aplicar&#10;etiquetas` with
  // `whiteSpace: pre-line`) - it's now the single-line `searchBar.applyLabels`
  // i18next key with `whiteSpace: nowrap`. Playwright normalizes whitespace
  // when matching text regardless, so this locator matched both before and
  // after; kept as a plain string, not a regression guard for the newline.
  const applyLabels = component.getByText("Aplicar etiquetas");
  await expectHitTestable(applyLabels, 'Anonimizador: "Aplicar etiquetas"');
});

test("Voz a Texto: toolbar/header controls are hit-testable with the side panel stacked", async ({
  mount,
}) => {
  const component = await mount(<TranscriptionEditorFixture />);

  // `t("editor.searchAria")` from the locale - same i18next-sourced pattern
  // Anonimizador's search input now uses too (`searchBar.searchAriaLabel`,
  // G3/G10), just a different namespace; same visible "Buscar" placeholder.
  const search = component.getByRole("searchbox", {
    name: "Buscar en la transcripción",
  });
  await expectHitTestable(search, "Voz a Texto: search input");

  // The "Modo Edición" control is a `<label htmlFor={switchId}>` wrapping a
  // Radix `Switch` (`role="switch"`, no aria-label - associated by
  // `htmlFor`/`id`) plus a `<span>` label. The report measured BOTH nodes
  // 100% covered, so both are hit-tested here.
  const editModeSwitch = component.getByRole("switch");
  await expectHitTestable(editModeSwitch, "Voz a Texto: Modo Edición switch");

  const editModeLabel = component.getByText("Modo Edición", { exact: true });
  await expectHitTestable(editModeLabel, "Voz a Texto: Modo Edición label");

  // Full accessible name is "Editar título de la transcripción" (not just
  // "Editar título") - only rendered while the title isn't being edited.
  const editTitle = component.getByRole("button", {
    name: "Editar título de la transcripción",
  });
  await expectHitTestable(editTitle, "Voz a Texto: edit-title pencil");
});

test("Set de Datos: toolbar search input is hit-testable (no panel mounted here)", async ({
  mount,
}) => {
  // `isAnnotable={false}` here, so `labelManagerOpen` is always false and
  // SidePanelColumn renders `hidden` (`display: none`) - there is no panel
  // to stack against on this screen. This test only proves the toolbar
  // itself stays reachable; the real defect on this screen is a separate
  // ticket (the document pane's own height, not this one).
  const component = await mount(<ValidateDatasetFixture />);

  const search = component.getByRole("searchbox", {
    name: "Buscar en el documento",
  });
  await expectHitTestable(search, "Set de Datos: search input");
});
