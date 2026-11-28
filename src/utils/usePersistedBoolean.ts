import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

type PersistedBoolean = {
  value: boolean;
  /** False until the stored value has been read; `value` is the default until then. */
  isLoaded: boolean;
  setValue: (nextValue: boolean) => void;
};

/**
 * A yes/no setting remembered on this device, such as a collapsed section or a hint the
 * user no longer needs.
 */
export function usePersistedBoolean(storageKey: string, defaultValue: boolean): PersistedBoolean {
  const [value, setStateValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(storageKey)
      .then((storedValue) => {
        if (isMounted && storedValue !== null) {
          setStateValue(storedValue === 'true');
        }
      })
      .catch((error) => console.warn(`Could not read "${storageKey}" from the device`, error))
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  const setValue = useCallback(
    (nextValue: boolean) => {
      setStateValue(nextValue);
      AsyncStorage.setItem(storageKey, String(nextValue)).catch((error) =>
        console.warn(`Could not save "${storageKey}" on the device`, error),
      );
    },
    [storageKey],
  );

  return { value, isLoaded, setValue };
}
