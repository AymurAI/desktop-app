import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { FeatureFlowEnum } from "../types/features";

type TutorialsSeen = Record<FeatureFlowEnum, boolean>;

interface LocalStorageStore {
  serverHost: string | null;
  setServerHost: (serverUrl: string) => void;
  clearServerHost: () => void;
  tutorialsSeen: TutorialsSeen;
  hasSeenTutorial: (feature: FeatureFlowEnum) => boolean;
  setTutorialSeen: (feature: FeatureFlowEnum) => void;
}

const useLocalStore = create<LocalStorageStore>()(
  devtools(
    persist(
      (set, get) => ({
        serverHost: null,
        setServerHost: (serverHost: string) => set({ serverHost }),
        clearServerHost: () => set({ serverHost: null }),
        tutorialsSeen: {
          [FeatureFlowEnum.Anonymizer]: false,
          [FeatureFlowEnum.Dataset]: false,
        },
        hasSeenTutorial: (feature: FeatureFlowEnum) =>
          get().tutorialsSeen[feature],
        setTutorialSeen: (feature: FeatureFlowEnum) =>
          set((state) => ({
            tutorialsSeen: { ...state.tutorialsSeen, [feature]: true },
          })),
      }),
      {
        name: "local-storage",
      },
    ),
  ),
);

// TODO: in the future, we should export all of these hooks under a single named exports
// usage will be like the following: `localStore.useServerHost`
export const useServerHost = () => useLocalStore((state) => state.serverHost);
export const useServerHostActions = () => {
  const setServerHost = useLocalStore((state) => state.setServerHost);
  const clearServerHost = useLocalStore((state) => state.clearServerHost);

  return {
    setServerHost,
    clearServerHost,
  };
};

export const useTutorialSeen = (feature: FeatureFlowEnum) =>
  useLocalStore((state) => state.tutorialsSeen[feature]);
export const useSetTutorialSeen = () =>
  useLocalStore((state) => state.setTutorialSeen);
