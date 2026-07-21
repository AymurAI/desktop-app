import { describe, expect, it } from "vitest";

import formatFileSize from "./formatFileSize";

describe("formatFileSize", () => {
  it("formats sub-megabyte sizes in kb", () => {
    expect(formatFileSize(2048)).toBe("2 kb");
    expect(formatFileSize(51_200)).toBe("50 kb");
  });

  it("formats megabyte-scale sizes in mb", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 mb");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 mb");
  });

  it("formats gigabyte-scale sizes in gb", () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe("2.0 gb");
  });
});
