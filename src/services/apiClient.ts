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

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Réponse serveur invalide (${response.status}). Réessayez dans quelques instants.`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Réponse serveur invalide. Réessayez dans quelques instants.');
  }
  const payload = data as Record<string, unknown>;

  if (!response.ok || typeof payload.error === 'string') {
    const errorMessage =
      typeof payload.error === 'string' && payload.error.trim().length > 0
        ? payload.error
        : `Erreur serveur (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as T;
}
