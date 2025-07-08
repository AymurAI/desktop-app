import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface LocalStorageStore {
  serverHost: string | null;
  actions: {
    setServerHost: (serverUrl: string) => void;
    clearServerHost: () => void;
  };
}

const useLocalStore = create<LocalStorageStore>()(
  devtools(
    persist(
      (set) => ({
        serverHost: null,
        actions: {
          setServerHost: (serverHost: string) => set({ serverHost }),
          clearServerHost: () => set({ serverHost: null }),
        },
      }),
      {
        name: "local-storage",
      },
    ),
  ),
);

const useServerHost = () => useLocalStore((state) => state.serverHost);
const useServerHostActions = () => {
  const { setServerHost, clearServerHost } = useLocalStore(
    (state) => state.actions,
  );

  return {
    setServerHost,
    clearServerHost,
  };
};

export const localStore = {
  useServerHost,
  useServerHostActions,
};
