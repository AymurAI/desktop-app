import { create } from "zustand";

interface HoverState {
  hoveredCanonicalId: string | null;
  setHoveredCanonicalId: (id: string | null) => void;
}

/**
 * Transient (non-persisted) store for sidebar hover state.
 * Used to synchronise which entity group is hovered in the sidebar
 * with the corresponding text highlights in the document.
 */
export const useHoverState = create<HoverState>()((set) => ({
  hoveredCanonicalId: null,
  setHoveredCanonicalId: (hoveredCanonicalId) => set({ hoveredCanonicalId }),
}));
