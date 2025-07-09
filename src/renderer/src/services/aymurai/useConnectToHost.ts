import api from "@/services/api";

import { useSchemedMutation } from "../utils";

export const useConnectToHost = () => {
  return useSchemedMutation({
    mutationFn: async (host: string) => api.get(host),
    onSuccess: (_data, host) => {
      api.defaults.baseURL = host;
    },
  });
};
