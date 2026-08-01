import NotFound from "@/components/layout/not-found";
import { expect, test } from "@playwright/experimental-ct-react";

test("404 screen uses the themed shell and does not overflow", async ({
  mount,
  page,
}) => {
  const component = await mount(<NotFound />);

  await expect(component.locator("header")).toHaveCount(1);

  const links = component.locator("a");
  expect(await links.count()).toBeGreaterThanOrEqual(1);
  await expect(links.first()).toBeVisible();

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
