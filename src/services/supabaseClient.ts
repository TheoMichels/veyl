import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../config/supabase';
import { isLocalMode } from '../config/storageMode';
import type { Database } from '../types/database';

export { isSupabaseConfigured } from '../config/supabase';

/**
 * Adaptateur de stockage hybride pour Supabase Auth :
 * - Sur le Web : utilise window.localStorage de manière synchrone et immédiate pour une restauration
 *   de session instantanée sans délai ni clignotement au rechargement de la page, tout en synchronisant
 *   AsyncStorage en miroir/backup.
 * - Sur mobile natif (iOS / Android) : utilise AsyncStorage.
 */
export const hybridAuthStorage = {
  getItem: (key: string): string | null | Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          return item;
        }
      } catch {
        // En cas de restriction localStorage (ex: navigation privée stricte)
      }
      return AsyncStorage.getItem(key).then((asyncItem) => {
        if (asyncItem !== null && typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(key, asyncItem);
          } catch {
            // Ignorer l'erreur d'écriture
          }
        }
        return asyncItem;
      });
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> | void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignorer l'erreur locale
      }
    }
    try {
      const promise = AsyncStorage.setItem(key, value);
      if (Platform.OS === 'web') {
        promise.catch(() => {});
        return;
      }
      return promise;
    } catch {
      // Ignorer
    }
  },
  removeItem: (key: string): Promise<void> | void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignorer l'erreur locale
      }
    }
    try {
      const promise = AsyncStorage.removeItem(key);
      if (Platform.OS === 'web') {
        promise.catch(() => {});
        return;
      }
      return promise;
    } catch {
      // Ignorer
    }
  },
};

/**
 * Client Supabase typé avec le schéma veyl.
 * En mode local ou si les variables d'environnement sont absentes, reste null.
 */
export const supabase: SupabaseClient<Database> | null =
  !isLocalMode && isSupabaseConfigured
    ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
        db: { schema: 'veyl' },
        auth: {
          storage: hybridAuthStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

/**
 * Retourne le client Supabase actif ou lève une exception explicite.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré. Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return supabase;
}
