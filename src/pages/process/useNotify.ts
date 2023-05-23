import { useEffect, useState } from 'react';
import { initProcessState, isPredictionCompleted } from './utils';

export default function useNotify(
  process: ReturnType<typeof initProcessState>
) {
  const [isToastVisible, setIsToastVisible] = useState(false);

  const hideToast = () => setIsToastVisible(false);

  return { isToastVisible, hideToast };
}
