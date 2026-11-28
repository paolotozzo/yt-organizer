import { useEffect, useReducer, useRef, useState, type Dispatch, type Reducer } from 'react';

type PersistedReducerOptions<State, Action> = {
  /** Identifies the stored state, e.g. the user id; a new key loads that state instead. */
  storageKey: string;
  reducer: Reducer<State, Action>;
  createInitialState: () => State;
  /** The action that replaces the whole state with the one read from storage. */
  createRestoredAction: (storedState: State) => Action;
  loadState: (storageKey: string) => Promise<State>;
  saveState: (storageKey: string, state: State) => Promise<void>;
  /** Used in warnings, e.g. "folder library". */
  description: string;
};

type PersistedReducer<State, Action> = {
  state: State;
  isLoaded: boolean;
  dispatch: Dispatch<Action>;
};

/**
 * A reducer whose state is loaded from storage on mount and saved back after every change.
 * Callers must wait for `isLoaded` before dispatching changes, otherwise the stored state
 * would overwrite them when it arrives.
 */
export function usePersistedReducer<State, Action>({
  storageKey,
  reducer,
  createInitialState,
  createRestoredAction,
  loadState,
  saveState,
  description,
}: PersistedReducerOptions<State, Action>): PersistedReducer<State, Action> {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const restoredStateRef = useRef<State | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreState() {
      let storedState = createInitialState();

      try {
        storedState = await loadState(storageKey);
      } catch (error) {
        console.warn(`Could not read the ${description} from the device`, error);
      }

      if (isMounted) {
        restoredStateRef.current = storedState;
        dispatch(createRestoredAction(storedState));
        setIsLoaded(true);
      }
    }

    restoreState();

    return () => {
      isMounted = false;
    };
    // The callbacks describe how to store the state; only a new storage key reloads it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    // Skip the initial empty state and the one just read from storage.
    if (!isLoaded || state === restoredStateRef.current) {
      return;
    }

    saveState(storageKey, state).catch((error: unknown) => {
      console.warn(`Could not save the ${description} to the device`, error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, state, storageKey]);

  return { state, isLoaded, dispatch };
}
