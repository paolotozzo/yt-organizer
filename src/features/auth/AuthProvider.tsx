import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { AuthSession } from './authSession';
import {
  configureGoogleSignIn,
  getGoogleAccessToken,
  GoogleAuthError,
  restorePreviousGoogleSession,
  signInWithGoogle,
  signOutOfGoogle,
} from './googleAuthClient';

type AuthStatus = 'restoring' | 'signedOut' | 'signingIn' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  errorMessage: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      configureGoogleSignIn();
      const restoredSession = await restorePreviousGoogleSession();

      if (isMounted) {
        setSession(restoredSession);
        setStatus(restoredSession ? 'signedIn' : 'signedOut');
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    setErrorMessage(null);
    setStatus('signingIn');

    try {
      const result = await signInWithGoogle();

      if (result.status === 'signedIn') {
        setSession(result.session);
        setStatus('signedIn');
      } else {
        setStatus('signedOut');
      }
    } catch (error) {
      setErrorMessage(describeError(error));
      setStatus('signedOut');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutOfGoogle();
    } finally {
      setSession(null);
      setStatus('signedOut');
    }
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      errorMessage,
      signIn,
      signOut,
      getAccessToken: getGoogleAccessToken,
    }),
    [status, session, errorMessage, signIn, signOut],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contextValue = useContext(AuthContext);

  if (!contextValue) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return contextValue;
}

function describeError(error: unknown): string {
  if (error instanceof GoogleAuthError) {
    return error.message;
  }

  return 'Something went wrong while signing in. Please try again.';
}
