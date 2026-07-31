import {
  FileCheckFixture,
  FileCheckGridFixture,
} from "@/test/playwright-fixtures/file-check-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

/**
 * G4 (tasks/responsive-fixes/issues/G4-anchos-fijos-y-truncados.md), issue
 * 07: `FileCheck.styles.ts` used to apply the file-name ellipsis via a
 * `"& p"` descendant selector on `Wrapper`, which reached BOTH the file name
 * `<Text>` and `<ErrorText>` (both are `styled("p")`). The error message
 * therefore clipped to the Card's 150px width with `white-space: nowrap`
 * regardless of length - measured identically across 768/1024/1366/1440/
 * 1920/2560 (`sw 520` vs `cw 150`). jsdom performs no layout, so
 * `scrollWidth`/`clientWidth` and `getComputedStyle` only mean something in
 * a real browser engine - hence this CT spec rather than another vitest
 * case. Reproduced with an arbitrary long message, no backend involved, per
 * the contract.
 */
const LONG_MESSAGE =
  "Este es un mensaje de error muy largo que antes se elidia a 150px de ancho con puntos suspensivos y ahora tiene que poder leerse completo, envolviendo en varias lineas en lugar de cortarse.";

test("FileCheck error message is not clipped and does not use nowrap", async ({
  mount,
  page,
}) => {
  const component = await mount(
    <FileCheckFixture hasError errorMessage={LONG_MESSAGE} />,
  );

  const errorP = component.getByText(LONG_MESSAGE);
  await expect(errorP).toBeVisible();

  // The assertion that fails on the pre-fix selector: 520 vs 150.
  const { scrollWidth, clientWidth } = await errorP.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

  // Guards the fix itself, independently of message length: if the `"& p"`
  // selector (or an equivalent) is ever reintroduced, this goes red even if
  // a future message happens to be short enough to still fit unclipped.
  const whiteSpace = await errorP.evaluate(
    (el) => getComputedStyle(el).whiteSpace,
  );
  expect(whiteSpace).not.toBe("nowrap");

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});

test("FileCheck file name keeps its own ellipsis and gets a tooltip", async ({
  mount,
}) => {
  const fileName =
    "un_nombre_de_archivo_bastante_largo_que_deberia_elidirse.docx";
  const component = await mount(
    <FileCheckFixture {...{ fileName }} hasError errorMessage={LONG_MESSAGE} />,
  );

  const nameP = component.getByText(fileName);
  const { scrollWidth, clientWidth } = await nameP.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(scrollWidth).toBeGreaterThan(clientWidth);

  const whiteSpace = await nameP.evaluate(
    (el) => getComputedStyle(el).whiteSpace,
  );
  expect(whiteSpace).toBe("nowrap");

  await expect(nameP).toHaveAttribute("title", fileName);
});

/**
 * Regression guard for the two real consumers (`finish-anonymizer.tsx`,
 * `finish-dataset.tsx`): removing `Wrapper`'s `maxWidth: "[150px]"` must not
 * make individual cards stretch to fill their grid cell now that nothing
 * caps `Wrapper`'s own width. Mounted with the SAME grid composition
 * `FinishMainContent` uses, at all six widths (playwright-ct.config.ts).
 */
test("FileCheck cards in FinishMainContent's real grid layout do not overflow the viewport", async ({
  mount,
  page,
}) => {
  await mount(<FileCheckGridFixture />);

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
