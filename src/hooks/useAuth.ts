import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isLocalMode } from '../config/storageMode';
import {
  getSession,
  onAuthStateChange,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
} from '../services/authService';
import { clearLocalCache } from '../services/syncService';

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

let globalAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: !isLocalMode,
  error: null,
};

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignorer
    }
  });
}

function setGlobalAuthState(partial: Partial<AuthState>): void {
  globalAuthState = {
    ...globalAuthState,
    ...partial,
  };
  notifyListeners();
}

let initPromise: Promise<void> | null = null;
let authSubscriptionActive = false;

function initAuth(): Promise<void> {
  if (isLocalMode) return Promise.resolve();
  if (initPromise) {
    return initPromise;
  }

  if (!authSubscriptionActive) {
    authSubscriptionActive = true;
    onAuthStateChange((newSession, newUser, event) => {
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          setGlobalAuthState({
            session: newSession,
            user: newUser,
            isLoading: false,
            error: null,
          });
          break;
        case 'SIGNED_OUT':
          void clearLocalCache();
          setGlobalAuthState({
            session: null,
            user: null,
            isLoading: false,
            error: null,
          });
          break;
        default:
          if (newSession !== undefined) {
            setGlobalAuthState({
              session: newSession,
              user: newUser,
            });
          }
          break;
      }
    });
  }

  initPromise = (async () => {
    try {
      const initialSession = await getSession();
      setGlobalAuthState({
        session: initialSession,
        user: initialSession?.user ?? null,
        isLoading: false,
      });
    } catch (err) {
      setGlobalAuthState({
        session: null,
        user: null,
        isLoading: false,
        error: err instanceof Error ? err.message : null,
      });
    }
  })();

  return initPromise;
}

initAuth();

export function useAuth(): UseAuthReturn {
  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    initAuth();
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => globalAuthState, []);
  const getServerSnapshot = useCallback(() => globalAuthState, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    initAuth();
  }, []);

  const clearError = useCallback(() => {
    setGlobalAuthState({ error: null });
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    setGlobalAuthState({ error: null });
    const res = await apiSignIn(email, password);

    if (res.error) {
      const msg = res.error.message || 'Erreur de connexion';
      setGlobalAuthState({ error: msg });
      return { success: false, error: msg };
    }

    setGlobalAuthState({
      user: res.user,
      session: res.session,
      error: null,
    });
    return { success: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    setGlobalAuthState({ error: null });
    const res = await apiSignUp(email, password);

    if (res.error) {
      const msg = res.error.message || 'Erreur lors de la création du compte';
      setGlobalAuthState({ error: msg });
      return { success: false, error: msg };
    }

    if (res.session && res.user) {
      setGlobalAuthState({
        user: res.user,
        session: res.session,
        error: null,
      });
    } else {
      setGlobalAuthState({
        error: null,
      });
    }

    return { success: true };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setGlobalAuthState({ error: null });
    await clearLocalCache();
    const res = await apiSignOut();

    if (res.error) {
      const msg = res.error.message || 'Erreur de déconnexion';
      setGlobalAuthState({ error: msg });
    } else {
      setGlobalAuthState({
        user: null,
        session: null,
        error: null,
      });
    }
  }, []);

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: Boolean(state.user),
    error: state.error,
    signIn,
    signUp,
    signOut,
    clearError,
  };
}
