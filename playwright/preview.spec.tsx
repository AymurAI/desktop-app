import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { PreviewFixture } from "@/test/playwright-fixtures/preview-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * G4 (tasks/responsive-fixes/issues/G4-anchos-fijos-y-truncados.md), criterio
 * 4, mitad de `/app/ANONYMIZER/preview`: MEDIDO ANTES DE TOCAR NADA (T4) - la
 * tarjeta "Vista previa del documento" YA respeta `sizes.content.max`
 * (1824px) a 1920/2560, sin ningun cambio de codigo. El cap no vive en
 * `MainContent` - su variante `full` no aplica ninguno, `inner`'s `full: true`
 * es literalmente `{}` (main-content.tsx:25-33) - sino en `FileSelectionLayout`,
 * cuyo `content` class aplica `maxWidth: "content.max"` + `mx: "auto"` al
 * `Stack` que envuelve el titulo Y los children (file-selection-layout.tsx:
 * 16-20): la `Card` es hija de un nodo ya capeado, y al ser un `<div>` sin
 * ancho propio (dist/index.js:2289-2295) se estira hasta ese cap por el
 * `align-items` por defecto del `Stack` (flex column).
 *
 * Medido en este harness antes de escribir esta asercion: 704 / 960 / 1302 /
 * 1344 / 1824 / 1824 a 768 / 1024 / 1366 / 1440 / 1920 / 2560 - coincide
 * exacto con la formula de abajo, sin margen que ocultar. Esta es la
 * asercion de REGRESION FUTURA para ese resultado, no la prueba de un fix:
 * no hay mutation test posible aca porque el ticket no cambio codigo de
 * produccion (ver el reporte de T4).
 *
 * La otra mitad del criterio 4 - la columna de documento de
 * `/app/DATA_SET/validation` contra `sizes.content.doc` (1520px) - YA esta
 * asertada y verde en validate-dataset.spec.tsx:41-42; no se duplica aca.
 */
test("Anonimizador preview: the document-preview card respects content.max instead of stretching to the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<PreviewFixture />);
  const ancho = testInfo.project.name.split("x")[0];
  const width = Number(ancho);

  // Matches FileSelectionLayout's own `viewport` px tiers (file-selection-
  // layout.tsx:7-12): base 4 (16px), sm 6 (24px), md 8 (32px), desktop 12
  // (48px) - Panda's `desktop` breakpoint is a 1440px min-width
  // (panda.config.ts:133), and no `lg`/`sm` boundary is crossed between
  // 768 and 1366 in this repo's default preset breakpoints, so all three
  // stay on the `md` tier. Capped at `sizes.content.max` (1824px,
  // panda.config.ts:137-141) - the only token this assertion is allowed to
  // reference, per the contract.
  const gutterPerSide = width >= 1440 ? 48 : 32;
  const expectedCardWidth = Math.min(width - gutterPerSide * 2, 1824);

  const card = component.getByTestId("preview-card");
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(Math.abs(box.width - expectedCardWidth)).toBeLessThanOrEqual(10);
  }

  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `preview-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
