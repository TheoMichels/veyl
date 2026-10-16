import { apiRequest } from '../services/apiClient';
import {
  createSourceSchema,
  toggleSourceSchema,
  deleteSourceSchema,
  type CreateSourceInput,
} from '../utils/validation';
import type { Source } from '../types/veyl';

interface SourcesListResponse {
  sources: Source[];
}

interface SourceMutationResponse {
  source: Source;
  id?: string;
}

export async function getSources(): Promise<Source[]> {
  const data = await apiRequest<SourcesListResponse | Source[]>('/api/sources');
  if (Array.isArray(data)) {
    return data;
  }
  return Array.isArray(data.sources) ? data.sources : [];
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  const parsed = createSourceSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Données de source invalides.');
  }

  const data = await apiRequest<SourceMutationResponse>('/api/sources', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  return data.source;
}

export async function toggleSourceStatus(id: string, isActive: boolean): Promise<Source> {
  const parsed = toggleSourceSchema.safeParse({ id, isActive });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Paramètres de statut invalides.');
  }

  const data = await apiRequest<SourceMutationResponse>('/api/sources', {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });

  return data.source;
}

export async function removeSource(id: string): Promise<void> {
  const parsed = deleteSourceSchema.safeParse({ id });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Identifiant de source invalide.');
  }

  await apiRequest<{ success: boolean }>(`/api/sources?id=${encodeURIComponent(parsed.data.id)}`, {
    method: 'DELETE',
    body: JSON.stringify(parsed.data),
  });
}
