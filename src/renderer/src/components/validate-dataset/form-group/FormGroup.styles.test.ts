import { describe, expect, it } from "vitest";
import container from "./FormGroup.styles";

// Panda class names are space-separated atomic tokens; `toContain` on the
// className STRING is a substring test, so every check here matches a WHOLE
// class token via the split class list (same convention as
// side-panel-column.test.tsx / reading-column.test.tsx).
function classTokens(className: string) {
  return className.split(/\s+/);
}

describe("FormGroup container (RSP-08b, migrated off Stitches)", () => {
  it("is a flex column", () => {
    const classes = classTokens(container);

    expect(classes).toContain("d_flex");
    expect(classes).toContain("flex-d_column");
  });

  it("keeps the previous 64px gap at >=desktop and tightens to 32px below it", () => {
    const classes = classTokens(container);

    // spacing "16" = 64px (matches the old Stitches `gap: 64` unchanged at
    // >=1440), spacing "8" = 32px (the new, tighter default below that).
    expect(classes).toContain("gap_8");
    expect(classes).toContain("desktop:gap_16");
  });
});
