import { useEffect, useState } from 'react';
import { initProcessState, isPredictionCompleted } from './utils';
import taskbar from 'services/taskbar';

export default function useNotify(
  process: ReturnType<typeof initProcessState>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPredictionCompleted(process)]);

  return { isToastVisible, hideToast };
}
