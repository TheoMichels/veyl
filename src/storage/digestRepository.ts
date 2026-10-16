import { apiRequest } from '../services/apiClient';
import type { DayGroup, Digest } from '../types/veyl';

interface DigestsResponse {
  groupedDigests: DayGroup[];
  digests: Digest[];
}

interface CronResponse {
  message: string;
  digestsCreated?: number;
}

export async function getGroupedDigests(): Promise<DayGroup[]> {
  const data = await apiRequest<DigestsResponse>('/api/digests');
  return Array.isArray(data.groupedDigests) ? data.groupedDigests : [];
}

export async function triggerDailyDigestsGeneration(): Promise<void> {
  await Promise.all([
    apiRequest<CronResponse>('/api/cron/ia'),
    apiRequest<CronResponse>('/api/cron/luxembourg'),
    apiRequest<CronResponse>('/api/cron/tech'),
  ]);
}
