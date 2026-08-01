import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    recordUnhandledRejection?: (reason: string) => void;
  }
}

type ViewTransitionCallback = () => Promise<void> | void;
type ViewTransitionOptions =
  | ViewTransitionCallback
  | { update: ViewTransitionCallback };
type TestViewTransition = {
  finished: Promise<void>;
  ready: Promise<void>;
  skipTransition: () => void;
  updateCallbackDone: Promise<void>;
};

/**
 * E2E harness, not CT: playwright-ct.config.ts stubs
 * @tanstack/react-router, so it cannot exercise createRouter, redirects, or
 * the View Transition path that produced T1's unhandled rejection.
 *
 * Scope: this intentionally covers real client-side navigation sufficient for
 * T1's cause (`/` auto-navigation, TanStack Link into `/app/ANONYMIZER`, and
 * browser history back). It does not claim the full anonymizer
 * onboarding -> preview -> process -> validation -> finish flow, because that
 * requires host, document, and backend predictions. VITE_DEV_HOST is supplied
 * by playwright-e2e.config.ts only so APIProtected renders without a backend.
 */
test("real route navigation emits no console errors", async ({ page }) => {
  const errors: string[] = [];

  await page.exposeFunction("recordUnhandledRejection", (reason: string) => {
    errors.push(`unhandledrejection: ${reason}`);
  });

  await page.addInitScript(() => {
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      window.recordUnhandledRejection?.(
        reason instanceof Error
          ? (reason.stack ?? reason.message)
          : `${reason}`,
      );
    });

    const transitionDocument = document as Document & {
      startViewTransition?: (
        options: ViewTransitionOptions,
      ) => TestViewTransition;
    };

    transitionDocument.startViewTransition = (options) => {
      const update =
        typeof options === "function" ? options : () => options.update();

      return {
        updateCallbackDone: Promise.resolve(update()).then(() => undefined),
        ready: Promise.reject(
          new DOMException("Transition was skipped", "AbortError"),
        ),
        finished: Promise.resolve(),
        skipTransition: () => {},
      };
    };
  });

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.stack ?? error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/home\/host$/);

  await page.goto("/home/features");
  await page.getByRole("link", { name: /Anonimizador/i }).click();
  await expect(page).toHaveURL(/\/app\/ANONYMIZER\/onboarding$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/home\/features$/);

  expect(errors).toEqual([]);
});
