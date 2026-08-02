import type { DocFile } from "@/types/file";
import type { RecomendacionState } from "@/types/recomendaciones";
import { describe, expect, it } from "vitest";
import { setRecomendacion } from "./actions";
import reducer from "./index";

const file = (name: string): DocFile => ({
  data: new File(["x"], name),
  selected: true,
  validationObject: { DECISIONES: [{}] },
});

const state = {
  documentId: "d1",
  origin: "inference",
} as unknown as RecomendacionState;

describe("SET_RECOMENDACION", () => {
  it("attaches the recomendacion state to the matching file", () => {
    const next = reducer(
      [file("a.pdf"), file("b.pdf")],
      setRecomendacion("a.pdf", state),
    );
    expect(next[0].recomendacion).toBe(state);
    expect(next[1].recomendacion).toBeUndefined();
  });

  it("replaces a previously attached state", () => {
    const once = reducer([file("a.pdf")], setRecomendacion("a.pdf", state));
    const twice = reducer(
      once,
      setRecomendacion("a.pdf", { ...state, origin: "validation" }),
    );
    expect(twice[0].recomendacion?.origin).toBe("validation");
  });
});
