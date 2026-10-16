import { apiRequest } from '../services/apiClient';
import { updateSettingsSchema, type UpdateSettingsInput } from '../utils/validation';
import type { Settings } from '../types/veyl';

interface SettingsResponse {
  settings?: Settings;
  id?: string;
  geminiPromptIA?: string;
  geminiPromptLux?: string;
  geminiPromptTech?: string;
  cronEnabled?: boolean;
}

function normalizeSettings(raw: SettingsResponse): Settings {
  const s = raw.settings || raw;
  return {
    id: s.id || 'default',
    geminiPromptIA: s.geminiPromptIA || '',
    geminiPromptLux: s.geminiPromptLux || '',
    geminiPromptTech: s.geminiPromptTech || '',
    cronEnabled: s.cronEnabled ?? true,
  };
}

export async function getSettings(): Promise<Settings> {
  const data = await apiRequest<SettingsResponse>('/api/settings');
  return normalizeSettings(data);
}

export async function saveSettings(input: UpdateSettingsInput): Promise<Settings> {
  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Les instructions Gemini sont invalides.');
  }

  const data = await apiRequest<SettingsResponse>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(parsed.data),
  });

  return normalizeSettings(data);
}
