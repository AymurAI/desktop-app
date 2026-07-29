import { css } from "@/styled/css";

/**
 * Mounted only by the Playwright CT smoke spec (playwright/smoke.spec.tsx),
 * never imported from the app itself - it exists to prove the RSP-01 layout
 * tokens render a real, browser-computed style. Not reachable from any knip
 * entry point on purpose; see knip.json's ignore list.
 */
export function SmokeBox() {
  return (
    <div
      data-testid="smoke-box"
      className={css({ width: "panel.side", maxWidth: "content.max" })}
    />
  );
}
