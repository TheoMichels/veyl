import { supabase } from '../services/supabaseClient';
import { getCurrentUser } from '../services/authService';
import { updateSettingsSchema, settingsSchema, type UpdateSettingsInput } from '../utils/validation';
import { readStored, writeStored } from './validatedStorage';
import type { Settings } from '../types/veyl';

export const SETTINGS_STORAGE_KEY = '@veyl_settings_v1';

export const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  geminiPromptIA: `Tu es un expert en veille technologique spécialisé en Intelligence Artificielle.
Fais une synthèse globale des 3 à 5 points les plus importants à retenir avec titres clairs et puces.`,
  geminiPromptLux: `Tu es un expert en veille stratégique et économique spécialisé sur le marché luxembourgeois (IT, finance, réglementation).
Fais une synthèse globale des 3 à 5 faits marquants.`,
  geminiPromptTech: `Tu es un journaliste tech. Résume les nouveautés matérielles (hardware) et logicielles (software). Structure avec des puces.`,
  cronEnabled: true,
};

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await readStored(SETTINGS_STORAGE_KEY, settingsSchema, DEFAULT_SETTINGS);
    if (supabase) {
      const user = await getCurrentUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!error && data) {
          const remote: Settings = {
            id: data.user_id,
            geminiPromptIA: data.gemini_prompt_ia,
            geminiPromptLux: data.gemini_prompt_lux,
            geminiPromptTech: data.gemini_prompt_tech,
            cronEnabled: data.cron_enabled,
          };
          await writeStored(SETTINGS_STORAGE_KEY, settingsSchema, remote);
          return remote;
        }
      }
    }
    return stored;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Données locales')) {
      throw error;
    }
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(input: UpdateSettingsInput): Promise<Settings> {
  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Les instructions Gemini sont invalides.');
  }

  const current = await getSettings();
  const nextSettings: Settings = {
    ...current,
    geminiPromptIA: parsed.data.geminiPromptIA,
    geminiPromptLux: parsed.data.geminiPromptLux,
    geminiPromptTech: parsed.data.geminiPromptTech,
    cronEnabled: parsed.data.cronEnabled ?? current.cronEnabled,
  };

  await writeStored(SETTINGS_STORAGE_KEY, settingsSchema, nextSettings);

  if (supabase) {
    try {
      const user = await getCurrentUser();
      if (user) {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          gemini_prompt_ia: nextSettings.geminiPromptIA,
          gemini_prompt_lux: nextSettings.geminiPromptLux,
          gemini_prompt_tech: nextSettings.geminiPromptTech,
          cron_enabled: nextSettings.cronEnabled,
        });
      }
    } catch {
      // Ignorer l'erreur réseau cloud non bloquante
    }
  }

  return nextSettings;
}
