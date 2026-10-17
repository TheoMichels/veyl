import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { supabase } from './supabaseClient';
import { readStored, writeStored } from '../storage/validatedStorage';
import {
  SOURCES_STORAGE_KEY,
  DEFAULT_SOURCES,
} from '../storage/sourceRepository';
import {
  DIGESTS_STORAGE_KEY,
  DEFAULT_DIGESTS,
} from '../storage/digestRepository';
import {
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS,
} from '../storage/settingsRepository';
import {
  sourcesListSchema,
  digestsListSchema,
  settingsSchema,
  validate,
} from '../utils/validation';
import type { Source, Digest, Settings, DigestCategory } from '../types/veyl';

/**
 * Supprime toutes les clés de données préfixées @veyl_ d'AsyncStorage et de window.localStorage.
 * Garantit qu'aucune donnée du compte précédent ne subsiste en local après déconnexion.
 */
export async function clearLocalCache(): Promise<void> {
  // 1. Purge AsyncStorage (React Native et stockage miroir web)
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const veylKeys = allKeys.filter((key) => key.startsWith('@veyl_'));
    if (veylKeys.length > 0) {
      if (typeof AsyncStorage.removeMany === 'function') {
        await AsyncStorage.removeMany(veylKeys);
      } else if (
        'multiRemove' in AsyncStorage &&
        typeof (AsyncStorage as { multiRemove?: (k: string[]) => Promise<void> }).multiRemove ===
          'function'
      ) {
        await (AsyncStorage as { multiRemove: (k: string[]) => Promise<void> }).multiRemove(
          veylKeys
        );
      } else {
        await Promise.all(veylKeys.map((k) => AsyncStorage.removeItem(k)));
      }
    }
  } catch {
    // Tolérance aux erreurs de suppression de stockage
  }

  // 2. Purge directe window.localStorage (web/PWA synchrone)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('@veyl_')) {
          toRemove.push(key);
        }
      }
      for (const k of toRemove) {
        window.localStorage.removeItem(k);
      }
    } catch {
      // Tolérance aux erreurs localStorage (quota, mode navigation privée)
    }
  }
}


export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
}

const remoteDigestSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  category: z.enum(['IA', 'Luxembourg', 'Tech']),
  title: z.string(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

const remoteSourceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  url: z.string(),
  category: z.enum(['IA', 'Luxembourg', 'Tech']),
  is_active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const remoteSettingsSchema = z.object({
  user_id: z.string(),
  gemini_prompt_ia: z.string(),
  gemini_prompt_lux: z.string(),
  gemini_prompt_tech: z.string(),
  cron_enabled: z.boolean(),
});

export async function pullFromCloud(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return { success: false, error: 'Client Supabase non initialisé.' };
  }

  try {
    // 1. Sources
    const { data: sourcesData, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (sourcesError) {
      throw new Error(`Erreur sources: ${sourcesError.message}`);
    }

    if (Array.isArray(sourcesData) && sourcesData.length > 0) {
      const parsedSources = validate(remoteSourceSchema.array(), sourcesData);
      const localSources: Source[] = parsedSources.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        category: s.category as DigestCategory,
        isActive: s.is_active,
      }));
      localSources.sort((a, b) => a.name.localeCompare(b.name));
      await writeStored(SOURCES_STORAGE_KEY, sourcesListSchema, localSources);
    }

    // 2. Digests
    const { data: digestsData, error: digestsError } = await supabase
      .from('digests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (digestsError) {
      throw new Error(`Erreur digests: ${digestsError.message}`);
    }

    if (Array.isArray(digestsData) && digestsData.length > 0) {
      const parsedDigests = validate(remoteDigestSchema.array(), digestsData);
      const localDigests: Digest[] = parsedDigests.map((d) => ({
        id: d.id,
        category: d.category as DigestCategory,
        title: d.title,
        content: d.content,
        createdAt: d.created_at,
      }));
      // Ordonnancement chronologique strictement décroissant par date
      localDigests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await writeStored(DIGESTS_STORAGE_KEY, digestsListSchema, localDigests);
    }

    // 3. User Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      throw new Error(`Erreur settings: ${settingsError.message}`);
    }

    if (settingsData) {
      const parsedSettings = validate(remoteSettingsSchema, settingsData);
      const localSettings: Settings = {
        id: parsedSettings.user_id,
        geminiPromptIA: parsedSettings.gemini_prompt_ia,
        geminiPromptLux: parsedSettings.gemini_prompt_lux,
        geminiPromptTech: parsedSettings.gemini_prompt_tech,
        cronEnabled: parsedSettings.cron_enabled,
      };
      await writeStored(SETTINGS_STORAGE_KEY, settingsSchema, localSettings);
    }

    return { success: true, message: 'Données synchronisées depuis le cloud.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Échec de synchronisation cloud.',
    };
  }
}

export async function pushToCloud(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return { success: false, error: 'Client Supabase non initialisé.' };
  }

  try {
    const localSources = await readStored(SOURCES_STORAGE_KEY, sourcesListSchema, DEFAULT_SOURCES);
    const localDigests = await readStored(DIGESTS_STORAGE_KEY, digestsListSchema, DEFAULT_DIGESTS);
    const localSettings = await readStored(SETTINGS_STORAGE_KEY, settingsSchema, DEFAULT_SETTINGS);

    if (localSources.length > 0) {
      const rows = localSources.map((s) => ({
        id: s.id,
        user_id: userId,
        name: s.name,
        url: s.url,
        category: s.category,
        is_active: s.isActive,
      }));
      const { error: srcErr } = await supabase.from('sources').upsert(rows);
      if (srcErr) throw new Error(`Échec envoi sources: ${srcErr.message}`);
    }

    if (localDigests.length > 0) {
      const rows = localDigests.map((d) => ({
        id: d.id,
        user_id: userId,
        category: d.category,
        title: d.title,
        content: d.content,
        created_at: d.createdAt,
      }));
      const { error: digErr } = await supabase.from('digests').upsert(rows);
      if (digErr) throw new Error(`Échec envoi digests: ${digErr.message}`);
    }

    const { error: setErr } = await supabase.from('user_settings').upsert({
      user_id: userId,
      gemini_prompt_ia: localSettings.geminiPromptIA,
      gemini_prompt_lux: localSettings.geminiPromptLux,
      gemini_prompt_tech: localSettings.geminiPromptTech,
      cron_enabled: localSettings.cronEnabled,
    });
    if (setErr) throw new Error(`Échec envoi réglages: ${setErr.message}`);

    return { success: true, message: 'Données locales envoyées sur le cloud.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Échec de sauvegarde vers le cloud.',
    };
  }
}

export async function syncAll(userId: string): Promise<SyncResult> {
  const pullRes = await pullFromCloud(userId);
  if (!pullRes.success) return pullRes;
  return pushToCloud(userId);
}
