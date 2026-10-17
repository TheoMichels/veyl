export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '8081') {
      return 'http://localhost:3001';
    }
    return '';
  }
  return 'http://localhost:3001';
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const errorMessage =
      typeof data.error === 'string' && data.error.trim().length > 0
        ? data.error
        : `Erreur serveur (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as T;
}
