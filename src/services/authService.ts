import type { AuthChangeEvent, AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { credentialsSchema, validate } from '../utils/validation';

function authError(error: unknown, fallback: string): Error {
  const details = typeof error === 'object' && error !== null ? (error as { code?: unknown; message?: unknown }) : {};
  const code = typeof details.code === 'string' ? details.code : '';
  const message = typeof details.message === 'string' ? details.message.toLowerCase() : '';

  if (code === 'invalid_credentials' || message.includes('invalid login')) {
    return new Error('Adresse e-mail ou mot de passe incorrect.');
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return new Error('Confirmez votre adresse e-mail avant de vous connecter.');
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return new Error('Un compte existe déjà avec cette adresse e-mail.');
  }
  if (code === 'weak_password' || message.includes('weak password')) {
    return new Error('Choisissez un mot de passe plus robuste.');
  }
  if (
    (code.startsWith('over_') && code.includes('rate_limit')) ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    code.includes('rate_limit') ||
    message.includes('rate limit')
  ) {
    return new Error('Trop de tentatives. Patientez quelques instants puis réessayez.');
  }
  if (message.includes('fetch') || message.includes('network')) {
    return new Error('Connexion au serveur impossible. Vérifiez votre connexion réseau puis réessayez.');
  }
  return new Error(fallback);
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | Error | null;
}

export interface SignOutResponse {
  error: AuthError | Error | null;
}

export interface AuthSubscription {
  unsubscribe: () => void;
}

/**
 * Inscription par Email et Mot de passe via Supabase.
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: new Error(
        "Supabase n'est pas configuré. Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
      ),
    };
  }

  try {
    const credentials = validate(credentialsSchema, { email, password });
    const { data, error } = await supabase.auth.signUp(credentials);

    if (error) {
      return {
        user: null,
        session: null,
        error: authError(error, 'Création du compte impossible. Vérifiez vos informations puis réessayez.'),
      };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: authError(err, 'Création du compte impossible. Vérifiez vos informations puis réessayez.'),
    };
  }
}

/**
 * Connexion par Email et Mot de passe via Supabase.
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: new Error(
        "Supabase n'est pas configuré. Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
      ),
    };
  }

  try {
    const credentials = validate(credentialsSchema, { email, password });
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      return {
        user: null,
        session: null,
        error: authError(error, 'Connexion impossible. Vérifiez vos informations puis réessayez.'),
      };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: authError(err, 'Connexion impossible. Vérifiez vos informations puis réessayez.'),
    };
  }
}

/**
 * Déconnexion de la session active.
 */
export async function signOut(): Promise<SignOutResponse> {
  if (!supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return {
      error: error ? authError(error, 'Déconnexion impossible. Réessayez dans quelques instants.') : null,
    };
  } catch (err) {
    return {
      error: authError(err, 'Déconnexion impossible. Réessayez dans quelques instants.'),
    };
  }
}

/**
 * Récupère l'utilisateur connecté depuis la session persistée.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return sessionData.session.user;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Récupère la session active persistée.
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Écoute les changements d'état d'authentification.
 */
export function onAuthStateChange(
  callback: (session: Session | null, user: User | null, event: AuthChangeEvent) => void
): AuthSubscription {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session, session?.user ?? null, event);
  });

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}
