import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import { DEFAULT_USER_ID } from './_auth';

export async function getCronUserId(req: IncomingMessage): Promise<string | null> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = Buffer.from(token);
    const expected = Buffer.from(secret);
    if (provided.length === expected.length && timingSafeEqual(provided, expected)) return DEFAULT_USER_ID;
  }
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(token);
    return error ? null : data.user?.id ?? null;
  } catch {
    return null;
  }
}
