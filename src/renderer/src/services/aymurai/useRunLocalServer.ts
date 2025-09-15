import { useEffect } from "react";

import api from "../api";
import { useSchemedQuery } from "../utils";
import { healthcheckSchema } from "./schema";

interface UseRunLocalServerProps {
  onSuccess?: () => void;
}
export const useRunLocalServer = ({onSuccess}: UseRunLocalServerProps) => {
  const {refetch, data, isFetching} = useSchemedQuery({
    schema: healthcheckSchema,
    queryKey: ["run-local-server"],
    queryFn: () => api.get("/server/healthcheck"),
    enabled: false,
    retryDelay: 1000,
    retry: 10,
  })

  const run = async ()=> {
    if (!window.electronAPI) throw new Error("Electron API not available. Check your preload script.");
    window.electronAPI.runBatch();

    await refetch();
  }

  const isSuccess = !!data?.status;
  const isRunning = isFetching && !data;
  
  useEffect(()=> {
    if (data?.status === "ok") onSuccess?.();
  }, [data?.status])

  return {
    isRunning,
    isSuccess,
    run,
  }
}