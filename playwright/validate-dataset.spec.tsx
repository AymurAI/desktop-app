import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ValidateDatasetFixture } from "@/test/playwright-fixtures/validate-dataset-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b red baseline (see tasks/responsive/plan.md), turned green by T11.
 * This screen mounts with `isAnnotable={false}` (matching the real Set de
 * Datos route), so its embedded FileAnnotator's own entities panel stays
 * closed/hidden - the 479px panel-width assertion is exercised by
 * file-annotator.spec.tsx instead, and this spec covers the document reading
 * column plus the overflow probe. `expect.soft` is used for the CSS/width
 * checks so a failure here doesn't skip the screenshot or the (hard)
 * overflow probe below it.
 */
test("Set de Datos validation screen fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<ValidateDatasetFixture />);
  const ancho = testInfo.project.name.split("x")[0];
  const width = Number(ancho);

  // RSP-08: ValidateDataset passes FileAnnotator `narrowDocument`, which
  // forces ReadingColumn's rule-C ("doc") variant regardless of panel state
  // (the panel here never opens - `isAnnotable={false}`). `doc` sets no
  // `max-width` at all (it's a plain `width` calc: min(88% of the pane,
  // 1520px)), so an exact `toHaveCSS("max-width", "1824px")` - rule A's
  // number - can never pass against it; that was the wrong rule for this
  // screen once a fixed-width form column sits beside the document. The
  // widths are fractional (88% of an integer pane), so measure and compare
  // within the contract's +/-10px tolerance instead of an exact string
  // match, same convention as file-annotator.spec.tsx.
  //
  // The "pane" is the outer Grid's first column: full width below `lg`
  // (single-column stack), 50/50 with the form Stack at `lg` (1024-1439,
  // no design exists for that range), and viewport-minus-594
  // (sizes.panel.form) at `desktop` (>=1440).
  const pane = width < 1024 ? width : width < 1440 ? width / 2 : width - 594;
  const expectedDocWidth = Math.min(pane * 0.88, 1520);

  const column = component.getByTestId("anon-reading-column");
  const docBox = await column.boundingBox();
  expect.soft(docBox).not.toBeNull();
  if (docBox) {
    expect
      .soft(Math.abs(docBox.width - expectedDocWidth))
      .toBeLessThanOrEqual(10);
  }

  // G1 criterio 3 (tasks/responsive-fixes/issues/G1-paneles-laterales.md):
  // "ninguna linea de texto queda rebanada horizontalmente" en la fila
  // apilada de abajo de `lg` (768). Ese criterio literal no es garantizable
  // por CSS para un scroller de alto arbitrario con contenido arbitrario -
  // cualquier contenedor con scroll corta una linea parcial en reposo, y eso
  // es normal (la captura de este mismo test lo muestra). Se implementa como
  // (a) el scroller del documento tiene una altura visible minima, calibrada
  // para que el reparto de filas 50/50 (el bug) la deje roja y el reparto
  // 62/38 (el arreglo) la deje verde, y (b) el ultimo parrafo entra completo
  // al llegar al fondo del scroll. Si lo que el reporte pedia literalmente
  // era que el borde nunca caiga DENTRO de un glifo (lo que exigiria snapear
  // el alto del scroller a multiplos de `line-height`), eso queda pendiente
  // de reabrir - no esta cubierto por lo de aca.
  if (width < 1024) {
    // `ReadingColumn` (RSP-07b/T17) siempre renderiza dos nodos: un div
    // externo (gutter, sin padding para `doc`) y uno interno (el cap, que es
    // el que lleva `data-testid`). El scroller real -`S.file`
    // (file-annotator/index.tsx:282), con `overflowY: auto`- es DOS niveles
    // arriba del testid, no uno. Se confirma por identidad (overflowY
    // computado) en vez de asumir la distancia en el arbol.
    const scroller = column.locator("xpath=../..");
    await expect(scroller).toHaveCount(1);
    const overflowY = await scroller.evaluate(
      (el) => getComputedStyle(el).overflowY,
    );
    expect(overflowY).toBe("auto");

    // (a) Umbral calibrado, no copiado del criterio del contrato: "6 lineas"
    // (6 x 25.6px = 153.6px, de `fontSize:[16px]` x `lineHeight:[160%]`,
    // FileAnnotator.styles.ts:60-61, aplicado por "& span") es inerte - el
    // scroller ya mide ~294px (~11.5 lineas) CON el bug puesto (reparto
    // 50/50), asi que "6 lineas" pasaria en verde antes del arreglo.
    //
    // Calibrado con el fixture montando el `Header` real (G1/T7) - antes se
    // omitia deliberadamente "porque arrastraria contexto de i18n/router",
    // pero i18n ya se inicializa globalmente en playwright/index.tsx y el
    // router ya estaba interceptado por el stub de este harness (solo hizo
    // falta agregarle `Link`, que usa `HeaderLogoLink`). Omitir el Header
    // media un pane MAS ALTO que el de la pantalla real (le falta la fila
    // fija del Header arriba en la misma columna flex), asi que el umbral
    // viejo (384px) tenia casi todo su margen contra el arreglo apoyado en
    // ese alto de mas: recalibrado midiendo ambos extremos CON el Header
    // puesto (ver el fixture): ~294.3px con el bug, ~392.3px con el arreglo
    // (reparto 62/38) - banda de ~98px, contra los ~110px que separaban
    // ~342.3px/~451.8px sin el Header (la pantalla real pierde ~0.62 x la
    // altura del Header en la fila del documento, ya que esa fila es el 62%
    // de lo que sobra). El corte se eligio en el medio de la banda medida,
    // con margen para las ~12px de variacion entre corridas observadas antes:
    // 13 lineas x 25.6px = 332.8px (~38.5px de margen contra el bug, ~59.5px
    // contra el arreglo).
    const LINE_HEIGHT_PX = 25.6;
    const MIN_VISIBLE_LINES = 13;
    const minScrollerHeight = MIN_VISIBLE_LINES * LINE_HEIGHT_PX; // 332.8px
    const scrollerBox = await scroller.boundingBox();
    expect.soft(scrollerBox).not.toBeNull();
    if (scrollerBox) {
      expect.soft(scrollerBox.height).toBeGreaterThanOrEqual(minScrollerHeight);
    }

    // (b) Guarda del padding, NO discriminador del reparto de filas: el
    // `pb: "8"` (32px) de `S.file` ya cuenta dentro de su propio
    // `scrollHeight`, asi que al tope del scroll el contenido termina 32px
    // por encima del borde inferior del scroller sea cual sea el reparto de
    // filas - medido con la mutacion de abajo, esta asercion pasa TANTO con
    // el bug (margen ~40px) como con el arreglo (sin overflow: el documento
    // ya entra entero, no hace falta scrollear). Se deja como regresion del
    // padding, no como prueba del arreglo del criterio 3.
    const paragraphs = component.locator('div[id^="p-"]');
    await expect(paragraphs).toHaveCount(6);
    const lastParagraph = paragraphs.last();
    await expect(lastParagraph).toHaveAttribute("id", "p-5");

    await scroller.evaluate((el) => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    });
    const lastParagraphBox = await lastParagraph.boundingBox();
    const scrollerBoxAtEnd = await scroller.boundingBox();
    expect.soft(lastParagraphBox).not.toBeNull();
    expect.soft(scrollerBoxAtEnd).not.toBeNull();
    if (lastParagraphBox && scrollerBoxAtEnd) {
      expect
        .soft(lastParagraphBox.y + lastParagraphBox.height)
        .toBeLessThanOrEqual(scrollerBoxAtEnd.y + scrollerBoxAtEnd.height + 1);
    }
  }

  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `dataset-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
