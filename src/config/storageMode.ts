import Constants from 'expo-constants';

export type StorageMode = 'local' | 'supabase';

export function resolveStorageMode(buildMode: unknown, hostname?: string): StorageMode {
  const host = hostname?.toLowerCase().replace(/\.$/, '');
  const isLoopback =
    host === 'localhost' ||
    host?.endsWith('.localhost') ||
    host === '::1' ||
    host === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(host ?? '');

  return buildMode === 'supabase' && !isLoopback ? 'supabase' : 'local';
}

export const storageMode = resolveStorageMode(
  Constants.expoConfig?.extra?.storageMode,
  typeof window !== 'undefined' ? window.location?.hostname : undefined
);

export const isLocalMode = storageMode === 'local';
