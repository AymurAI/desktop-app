import taskbar from "@/services/taskbar";
import { useEffect, useState } from "react";
import { type initProcessState, isPredictionCompleted } from "./utils";

export default function useNotify(
  process: ReturnType<typeof initProcessState>,
) {
  const [isToastVisible, setIsToastVisible] = useState(false);

  const hideToast = () => setIsToastVisible(false);

  // Not ideal to use an useEffect to change an state, but doing it ina proper way
  // requires refactor to change state based on process state
  useEffect(() => {
    if (isPredictionCompleted(process) && !isToastVisible) {
      taskbar.notify();
      setIsToastVisible(true);
    }
  }, [isPredictionCompleted(process)]);

  return { isToastVisible, hideToast };
}
