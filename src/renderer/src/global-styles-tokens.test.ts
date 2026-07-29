import { token } from "@/styled/tokens";
import { describe, expect, it } from "vitest";

// panda.config.ts's globalCss (`mark.predicted-word button.remove-tag`) was
// migrated off raw hex literals onto these two tokens (RSP-12a). This
// guards the resolved value rather than the token name, so a preset change
// that silently altered either colour would be caught here.
describe("panda.config.ts globalCss token mapping (RSP-12a)", () => {
  it("system.error resolves to the exact legacy #DC582E", () => {
    expect(token("colors.system.error")).toBe("#DC582E");
  });

  it("text.onbutton-alternative resolves to the exact legacy #FFFFFF", () => {
    expect(token("colors.text.onbutton-alternative")).toBe("#FFFFFF");
  });
});

// The remaining `mark.predicted-word`/`mark.searched-word` rules and the
// global `*` font family were migrated off raw literals in RSP-12e. Same
// resolved-value guard as above.
describe("panda.config.ts globalCss token mapping (RSP-12e)", () => {
  it("fonts.primary resolves to the legacy Archivo stack (with quoted Helvetica Neue)", () => {
    expect(token("fonts.primary")).toBe(
      '"Archivo", -apple-system, "Helvetica Neue", Helvetica, Roboto, sans-serif',
    );
  });

  it("fonts.file resolves to the exact legacy Times New Roman stack", () => {
    expect(token("fonts.file")).toBe('"Times New Roman", Times, serif');
  });

  it("system.success resolves to the exact legacy #1B834E", () => {
    expect(token("colors.system.success")).toBe("#1B834E");
  });

  it("bg.secondary-highlight resolves to the exact legacy #E0DDE2", () => {
    expect(token("colors.bg.secondary-highlight")).toBe("#E0DDE2");
  });
});

// `html { color }` had no `// TODO: Replace token here` marker and was
// missed by both prior audits' marker-scoped sweeps. Tokenized in RSP-12b;
// same resolved-value guard as above.
describe("panda.config.ts globalCss token mapping (RSP-12b)", () => {
  it("text.default resolves to the exact legacy #110041", () => {
    expect(token("colors.text.default")).toBe("#110041");
  });
});

// Folded in from the retired src/renderer/src/styled-tokens.test.ts (RSP-12c):
// that file only asserted `typeof className === "string"` and
// `className.length > 0` on a `css()` call using `content.max`/`panel.side`,
// which would still pass even if those tokens were deleted - Panda's runtime
// `css()` emits a class from the value string regardless of whether the
// token resolves; `pnpm typecheck` under `strictTokens: true`
// (panda.config.ts:126) is what actually enforces the tokens exist. Only a
// RESOLVED-VALUE assert, via the generated `token()` helper, can fail.
describe("RSP-01 layout size tokens (folded from styled-tokens.test.ts, RSP-12c)", () => {
  it("content.max resolves to the exact 1824px", () => {
    expect(token("sizes.content.max")).toBe("1824px");
  });

  it("panel.side resolves to the exact 479px", () => {
    expect(token("sizes.panel.side")).toBe("479px");
  });
});

// Adversary: the describe above states the right principle - only a
// resolved-value assert can fail - and then applies it to 2 of the 6 layout
// tokens. Reproduced with a mutation: setting content.split 1672->1200,
// content.doc 1520->1100, panel.form 594->500, panel.sideCompact 360->300 and
// breakpoints.desktop 1440px->1400px in panda.config.ts, then re-running
// `pnpm panda codegen`, leaves `pnpm test` fully green (370 tests) and
// `pnpm validate` green too - biome and tsc check token NAMES under
// strictTokens, never their values, and every other layout test asserts
// generated CLASS NAMES (`max-w_content.split`, `desktop:w_panel.side`,
// `desktop:grid-tc_[... token(sizes.panel.form)]`), which are identical
// whatever the token resolves to. The four measured numbers this whole batch
// exists to establish (rules A/B/C's caps and the two panel widths) plus the
// breakpoint they hinge on were therefore unguarded by the deterministic
// gates; only the manual/CI-only `pnpm test:responsive` could see them.
describe("RSP-01 layout tokens - the remaining measured values", () => {
  it("content.split resolves to the exact 1672px (rule B's cap)", () => {
    expect(token("sizes.content.split")).toBe("1672px");
  });

  it("content.doc resolves to the exact 1520px (rule C's cap)", () => {
    expect(token("sizes.content.doc")).toBe("1520px");
  });

  it("panel.form resolves to the exact 594px (Set de Datos' form column)", () => {
    expect(token("sizes.panel.form")).toBe("594px");
  });

  it("panel.sideCompact resolves to the exact 360px (the 1024-1439 panel)", () => {
    expect(token("sizes.panel.sideCompact")).toBe("360px");
  });
});

describe("RSP-01 desktop breakpoint", () => {
  it("resolves to the exact 1440px", () => {
    expect(token("breakpoints.desktop")).toBe("1440px");
  });

  it("sits between the preset's xl (1280px) and 2xl (1536px)", () => {
    // Panda orders breakpoints by numeric value, so this ordering is what
    // makes `desktop` override `xl` and lose to `2xl` in the cascade.
    const px = (value: string) => Number.parseInt(value, 10);

    expect(px(token("breakpoints.xl"))).toBeLessThan(
      px(token("breakpoints.desktop")),
    );
    expect(px(token("breakpoints.desktop"))).toBeLessThan(
      px(token("breakpoints.2xl")),
    );
  });
});
