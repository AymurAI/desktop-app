import { describe, it, expect, beforeEach } from "vitest";
import { createCheckpointService } from "../checkpoint-service";
import type { CheckpointData } from "../types";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
  clear: () => { for (const key of Object.keys(store)) delete store[key]; },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

const mockData: CheckpointData = {
  predictions: [
    {
      text: "Juan",
      start_char: 0,
      end_char: 4,
      paragraphId: "p1",
      attrs: {
        aymurai_label: "PER" as any,
        aymurai_label_subclass: null,
        aymurai_alt_text: null,
        aymurai_alt_start_char: 0,
        aymurai_alt_end_char: 4,
      },
    },
  ],
  validationObject: {},
  validated: false,
  savedAt: Date.now(),
};

describe("CheckpointService", () => {
  let service: ReturnType<typeof createCheckpointService>;

  beforeEach(() => {
    localStorageMock.clear();
    service = createCheckpointService();
  });

  it("save and load roundtrip", () => {
    service.save("doc1", mockData);
    const loaded = service.load("doc1");
    expect(loaded).toEqual(mockData);
  });

  it("load returns null for missing document", () => {
    expect(service.load("nonexistent")).toBeNull();
  });

  it("clear removes checkpoint", () => {
    service.save("doc1", mockData);
    service.clear("doc1");
    expect(service.load("doc1")).toBeNull();
  });

  it("loadAll returns all saved checkpoints", () => {
    const data2 = { ...mockData, savedAt: Date.now() + 1 };
    service.save("doc1", mockData);
    service.save("doc2", data2);
    const all = service.loadAll();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all.doc1).toEqual(mockData);
    expect(all.doc2).toEqual(data2);
  });

  it("loadAll ignores non-checkpoint keys", () => {
    localStorage.setItem("other-key", "value");
    service.save("doc1", mockData);
    const all = service.loadAll();
    expect(Object.keys(all)).toHaveLength(1);
    expect(all.doc1).toEqual(mockData);
  });
});
