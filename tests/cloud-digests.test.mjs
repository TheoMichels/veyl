import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const row = { id: 'real-1', category: 'IA', title: 'Veille', content: 'RSS', created_at: '2026-10-19T03:00:00Z' };
function repository({ cloud = true, rows = [row], error = null, token = 'session-token', requestError = null, response = { message: 'Success', digestsCreated: 1 } } = {}) {
  let cache = [{ ...row, id: 'dig_gen_old', createdAt: row.created_at }];
  const calls = [];
  const client = {
    auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null }, error: null }) },
    from: () => {
      calls.push('select');
      return { select: () => ({ eq: () => ({ order: async () => ({ data: rows, error }) }) }) };
    },
  };
  const repo = loadTypeScript('src/storage/digestRepository.ts', {
    '../services/supabaseClient': { supabase: cloud ? client : null },
    '../services/authService': { getCurrentUser: async () => token ? { id: 'owner' } : null },
    '../services/apiClient': { apiRequest: async (endpoint, options) => {
      calls.push({ endpoint, options });
      if (requestError) throw new Error(requestError);
      return response;
    } },
    './validatedStorage': {
      readStored: async () => cache,
      writeStored: async (_key, _schema, value) => { cache = value; },
    },
  });
  return { repo, calls, cache: () => cache };
}

test('AC01: cron rewrite passes category; SPA excludes API and schedules are preserved', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.deepEqual(config.rewrites[0], { source: '/api/cron/:category', destination: '/api/cron/[category]?category=:category' });
  const spa = config.rewrites.find(rule => rule.destination === '/index.html');
  const pattern = new RegExp(`^${spa.source}$`);
  assert.equal(pattern.test('/api/unknown'), false);
  assert.equal(pattern.test('/api'), false);
  assert.equal(pattern.test('/settings'), true);
  assert.deepEqual(config.crons.map(cron => cron.schedule), ['0 3 * * 1-5', '0 3 * * 5', '0 3 * * 1-5']);
});

test('AC02: cloud calls three categories with bearer token and refreshes cache from Supabase', async () => {
  const state = repository();
  await state.repo.triggerDailyDigestsGeneration();
  const requests = state.calls.filter(call => typeof call === 'object');
  assert.deepEqual(requests.map(call => call.endpoint), ['/api/cron/ia', '/api/cron/luxembourg', '/api/cron/tech']);
  for (const call of requests) assert.equal(call.options.headers.Authorization, 'Bearer session-token');
  assert.equal(state.calls.at(-1), 'select');
  assert.deepEqual(state.cache().map(digest => digest.id), ['real-1']);
});

test('AC02: absent session and generation failure propagate without synthetic cache writes', async () => {
  for (const options of [{ token: null }, { requestError: 'Échec Gemini' }, { response: {} }]) {
    const state = repository(options);
    await assert.rejects(state.repo.triggerDailyDigestsGeneration());
    assert.equal(state.cache()[0].id, 'dig_gen_old');
  }
});

test('AC03: cloud reads fresh data, clears empty cache, rejects database failures', async () => {
  const state = repository();
  assert.equal((await state.repo.getDigests())[0].id, 'real-1');
  const empty = repository({ rows: [] });
  assert.equal((await empty.repo.getDigests()).length, 0);
  assert.equal(empty.cache().length, 0);
  await assert.rejects(repository({ error: { message: 'offline' } }).repo.getDigests());
});

test('AC03: local generation remains offline and produces three simulated digests', async () => {
  const state = repository({ cloud: false });
  await state.repo.triggerDailyDigestsGeneration();
  assert.equal(state.calls.length, 0);
  assert.equal(state.cache().length, 4);
  assert.ok(state.cache().slice(0, 3).every(digest => digest.id.startsWith('dig_gen_')));
});

test('AC02: API rejects HTML 200, malformed JSON and JSON error responses', async () => {
  for (const response of [
    new Response('<html>SPA</html>', { headers: { 'Content-Type': 'text/html' } }),
    new Response('{bad', { headers: { 'Content-Type': 'application/json' } }),
    Response.json({ error: 'Échec Gemini' }),
    Response.json({ error: 'Refusé' }, { status: 403 }),
  ]) {
    const { apiRequest } = loadTypeScript('src/services/apiClient.ts', {}, { fetch: async () => response });
    await assert.rejects(apiRequest('/api/cron/ia'));
  }
});

test('AC04: cron excludes fake digests and uses real cutoff or 48h fallback', async () => {
  for (const lastDigest of [null, { createdAt: new Date(Date.now() - 3600000) }]) {
    let query;
    let analyzed = '';
    const prisma = {
      settings: { findUnique: async () => ({ cronEnabled: true, geminiPromptIA: 'prompt' }) },
      source: { findMany: async () => [{ url: 'https://example.org/rss', name: 'RSS' }] },
      digest: { findFirst: async (args) => { query = args; return lastDigest; }, create: async () => ({}) },
    };
    const { default: handler } = loadTypeScript('api/cron/[category].ts', {
      '@prisma/client': { PrismaClient: function () { return prisma; } },
      '../_cronAuth': { getCronUserId: async () => 'owner' },
      '../../src/lib/rss': { fetchFeed: async () => [2, 24, 49].map(hours => ({ pubDate: new Date(Date.now() - hours * 3600000), title: `article-${hours}`, content: 'RSS', link: '' })) },
      '../../src/lib/gemini': { analyzeGlobalFeed: async (text) => { analyzed = text; return 'Synthèse'; } },
    });
    const res = { status: () => res, json: () => {} };
    await handler({ query: { category: 'ia' }, headers: {} }, res);
    assert.deepEqual(JSON.parse(JSON.stringify(query.where.NOT)), [{ id: { startsWith: 'dig_gen_' } }, { id: { startsWith: 'dig_init_' } }]);
    assert.equal(analyzed.includes('article-24'), lastDigest === null);
    assert.equal(analyzed.includes('article-49'), false);
  }
});

test('AC02 auth: missing/invalid token rejected; verified session and cron secret accepted', async () => {
  const env = { CRON_SECRET: 'cron-secret', EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-key' };
  const { getCronUserId } = loadTypeScript('api/_cronAuth.ts', {
    './_auth': { DEFAULT_USER_ID: 'owner' },
    '@supabase/supabase-js': { createClient: () => ({ auth: { getUser: async (token) => ({
      data: { user: token === 'verified' ? { id: 'verified-owner' } : null },
      error: token === 'verified' ? null : { message: 'Invalid JWT' },
    }) } }) },
  }, { process: { env } });
  assert.equal(await getCronUserId({ headers: {} }), null);
  assert.equal(await getCronUserId({ headers: { authorization: 'Bearer forged' } }), null);
  assert.equal(await getCronUserId({ headers: { authorization: 'Bearer cron-secret' } }), 'owner');
  assert.equal(await getCronUserId({ headers: { authorization: 'Bearer verified' } }), 'verified-owner');
});

test('AC02 auth: cron handler returns 401 without accessing Prisma for unauthorized request', async () => {
  let status;
  let payload;
  const { default: handler } = loadTypeScript('api/cron/[category].ts', {
    '@prisma/client': { PrismaClient: function () { return {}; } },
    '../_cronAuth': { getCronUserId: async () => null },
    '../../src/lib/rss': { fetchFeed: async () => [] },
    '../../src/lib/gemini': { analyzeGlobalFeed: async () => '' },
  });
  const res = { status: (value) => { status = value; return res; }, json: (value) => { payload = value; } };
  await handler({ query: { category: 'ia' }, headers: {} }, res);
  assert.equal(status, 401);
  assert.ok(payload.error);
});
