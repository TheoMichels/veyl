import type { IncomingMessage } from 'node:http';

export const DEFAULT_USER_ID = process.env.OWNER_USER_ID || '15278318-e637-4962-b832-a4827b87c64a';

export function getRequestUserId(req: IncomingMessage): string {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
        if (typeof payload.sub === 'string' && payload.sub.length > 0) {
          return payload.sub;
        }
      }
    } catch {
      // Ignorer l'échec de décodage et replier sur l'utilisateur par défaut
    }
  }
  return DEFAULT_USER_ID;
}
