import { ToastFooterFixture } from "@/test/playwright-fixtures/toast-footer-fixture";
import {
  type Locator,
  type Page,
  expect,
  test,
} from "@playwright/experimental-ct-react";

const WARNING_TOAST_BACKGROUND = "rgb(255, 247, 219)";

type Rect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

function intersectionArea(first: Rect, second: Rect) {
  const width = Math.max(
    0,
    Math.min(first.right, second.right) - Math.max(first.left, second.left),
  );
  const height = Math.max(
    0,
    Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
  );

  return width * height;
}

async function findWarningToastRects(page: Page) {
  return page.evaluate((background) => {
    const rectFor = (element: Element) => {
      const rect = element.getBoundingClientRect();

      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };

    return Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.backgroundColor === background &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map(rectFor);
  }, WARNING_TOAST_BACKGROUND);
}

async function getFooterControlRects(component: Locator) {
  return component
    .getByTestId("vtt-finish-footer")
    .locator("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();

        return {
          bottom: rect.bottom,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width,
        };
      }),
    );
}

test("Voz a Texto finish toasts do not cover footer controls", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<ToastFooterFixture />);
  const footer = component.getByTestId("vtt-finish-footer");
  await expect(footer).toBeVisible();

  const footerBox = await footer.boundingBox();
  expect(footerBox).not.toBeNull();
  testInfo.annotations.push({
    type: "footer-height",
    description: `${testInfo.project.name}: ${footerBox?.height.toFixed(2)}px`,
  });

  const toastRects = await findWarningToastRects(page);
  expect(toastRects.length).toBeGreaterThan(0);

  const controlRects = await getFooterControlRects(component);
  expect(controlRects).toHaveLength(2);

  for (const toastRect of toastRects) {
    expect(toastRect.top).toBeGreaterThanOrEqual(0);
    expect(toastRect.bottom).toBeLessThanOrEqual(page.viewportSize()?.height);

    for (const controlRect of controlRects) {
      expect(intersectionArea(toastRect, controlRect)).toBe(0);
    }
  }
});

test("Voz a Texto finish stacked toasts stay clear of footer controls", async ({
  mount,
  page,
}) => {
  const component = await mount(<ToastFooterFixture toastCount={2} />);
  await expect(component.getByTestId("vtt-finish-footer")).toBeVisible();

  const toastRects = await findWarningToastRects(page);
  expect(toastRects.length).toBeGreaterThanOrEqual(2);

  const controlRects = await getFooterControlRects(component);
  expect(controlRects).toHaveLength(2);

  for (const toastRect of toastRects) {
    expect(toastRect.top).toBeGreaterThanOrEqual(0);
    expect(toastRect.bottom).toBeLessThanOrEqual(page.viewportSize()?.height);

    for (const controlRect of controlRects) {
      expect(intersectionArea(toastRect, controlRect)).toBe(0);
    }
  }
});
