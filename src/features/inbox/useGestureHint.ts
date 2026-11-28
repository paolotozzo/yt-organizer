import { useCallback } from 'react';

import { usePersistedBoolean } from '@/utils/usePersistedBoolean';

type GestureHint = {
  /** True while the user has not used the gesture yet, so the hint is still worth showing. */
  isVisible: boolean;
  /** Call when the user performs the gesture; the hint then stays hidden for good. */
  markGestureUsed: () => void;
};

/** A "long press to…" hint that disappears once the user has used that gesture. */
export function useGestureHint(gestureName: string): GestureHint {
  const { value: hasUsedGesture, isLoaded, setValue } = usePersistedBoolean(
    `gestureUsed:${gestureName}`,
    false,
  );

  const markGestureUsed = useCallback(() => {
    if (!hasUsedGesture) {
      setValue(true);
    }
  }, [hasUsedGesture, setValue]);

  // Hidden until the stored value is known, so a learned hint never flashes on screen.
  return { isVisible: isLoaded && !hasUsedGesture, markGestureUsed };
}
