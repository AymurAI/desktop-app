import { CanceledError } from "axios";
import { describe, expect, it, vi } from "vitest";
import { mockSummarizeStream } from "./mockSummarize";

describe("mockSummarizeStream", () => {
  it("rejects with a CanceledError when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      mockSummarizeStream("texto", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(CanceledError);
  });

  it("streams the mock summary word by word when not aborted", async () => {
    vi.useFakeTimers();
    try {
      const partials: string[] = [];
      const resultPromise = mockSummarizeStream("texto", {
        onPartialText: (text) => partials.push(text),
      });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.summary).toBe(partials.at(-1));
      expect(partials.length).toBeGreaterThan(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
