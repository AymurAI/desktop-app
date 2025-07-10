import api from "@/services/api";

import z from "zod";
import { useSchemedMutation } from "../utils";

export const useConnectToHost = () => {
  return useSchemedMutation({
    mutationKey: ["healthcheck"],
    mutationFn: (host: string) =>
      api.get(`${host}/server/healthcheck`).then((res) => res.data),
    schema: z.object({
      status: z.string(),
    }),
    onSuccess: (_data, host) => {
      api.defaults.baseURL = host;
    },
  });
};
