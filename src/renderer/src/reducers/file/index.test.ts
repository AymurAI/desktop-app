import { describe, expect, it } from "vitest";
import { addFiles, replaceFile, setFileDuration } from "./actions";
import reducer from "./index";

describe("file media duration", () => {
  it("stores the browser-reported duration with the selected file", () => {
    const file = new File(["audio"], "audiencia.wav", { type: "audio/wav" });
    const state = reducer([], addFiles([file]));

    const next = reducer(state, setFileDuration(file.name, 11_284.6));

    expect(next[0].durationMs).toBe(11_284.6);
    expect(state[0].durationMs).toBeUndefined();
  });

  it("drops stale duration metadata when replacing the file", () => {
    const original = new File(["old"], "original.wav", {
      type: "audio/wav",
    });
    const replacement = new File(["new"], "replacement.wav", {
      type: "audio/wav",
    });
    const withDuration = reducer(
      reducer([], addFiles([original])),
      setFileDuration(original.name, 11_000),
    );

    const next = reducer(withDuration, replaceFile(original.name, replacement));

    expect(next[0].data).toBe(replacement);
    expect(next[0].durationMs).toBeUndefined();
  });
});
