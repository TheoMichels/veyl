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
  return nextSettings;
}
