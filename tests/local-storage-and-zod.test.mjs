import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const rootDir = process.cwd();

test('L3: src/config/storageMode.ts résout correctement le mode selon buildMode et hostname', () => {
  const mod = loadTypeScript('src/config/storageMode.ts', {
    'expo-constants': { expoConfig: { extra: { storageMode: 'local' } } },
  });

  const { resolveStorageMode } = mod;
  assert.equal(typeof resolveStorageMode, 'function');

  // Origines loopback -> toujours local
  assert.equal(resolveStorageMode('supabase', 'localhost'), 'local');
  assert.equal(resolveStorageMode('supabase', 'app.localhost'), 'local');
  assert.equal(resolveStorageMode('supabase', '127.0.0.1'), 'local');
  assert.equal(resolveStorageMode('supabase', '::1'), 'local');
  assert.equal(resolveStorageMode('supabase', '[::1]'), 'local');

  // Build hors Vercel ou non-supabase -> toujours local
  assert.equal(resolveStorageMode('local', 'veyl.vercel.app'), 'local');
  assert.equal(resolveStorageMode(undefined, 'veyl.vercel.app'), 'local');

  // Build Vercel cloud sur domaine distant -> supabase
  assert.equal(resolveStorageMode('supabase', 'veyl.vercel.app'), 'supabase');
});

test('L3: Schémas Zod d entité et validation sécurisée', () => {
  const {
    digestSchema,
    digestsListSchema,
    sourceSchema,
    sourcesListSchema,
    settingsSchema,
    validate,
  } = loadTypeScript('src/utils/validation.ts');

  assert.ok(digestSchema, 'digestSchema doit être exporté');
  assert.ok(digestsListSchema, 'digestsListSchema doit être exporté');
  assert.ok(sourceSchema, 'sourceSchema doit être exporté');
  assert.ok(sourcesListSchema, 'sourcesListSchema doit être exporté');
  assert.ok(settingsSchema, 'settingsSchema doit être exporté');
  assert.ok(validate, 'validate doit être exporté');

  // Validation nominale Digest
  const validDigest = {
    id: 'dig-1',
    category: 'IA',
    title: 'Titre de veille',
    content: 'Contenu Markdown',
    createdAt: new Date().toISOString(),
  };
  assert.deepEqual(validate(digestSchema, validDigest), validDigest);

  // Rejet si altéré
  assert.throws(() => validate(digestSchema, { ...validDigest, category: 'Inconnu' }));
  assert.throws(() => validate(digestSchema, { ...validDigest, title: '' }));

  // Validation nominale Source
  const validSource = {
    id: 'src-1',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Tech',
    isActive: true,
  };
  assert.deepEqual(validate(sourceSchema, validSource), validSource);
  assert.throws(() => validate(sourceSchema, { ...validSource, url: 'not-a-url' }));

  // Validation nominale Settings
  const validSettings = {
    id: 'default',
    geminiPromptIA: 'Prompt IA',
    geminiPromptLux: 'Prompt Lux',
    geminiPromptTech: 'Prompt Tech',
    cronEnabled: true,
  };
  assert.deepEqual(validate(settingsSchema, validSettings), validSettings);
});

test('L3: Clés de stockage conformes à stack-target.md (@veyl_*_v1) et docs/LOCAL_STORAGE.md', () => {
  const digestRepoPath = path.join(rootDir, 'src', 'storage', 'digestRepository.ts');
  const sourceRepoPath = path.join(rootDir, 'src', 'storage', 'sourceRepository.ts');
  const settingsRepoPath = path.join(rootDir, 'src', 'storage', 'settingsRepository.ts');
  const docPath = path.join(rootDir, 'docs', 'LOCAL_STORAGE.md');

  assert.ok(fs.existsSync(docPath), 'docs/LOCAL_STORAGE.md doit exister');
  const docContent = fs.readFileSync(docPath, 'utf8');
  assert.match(docContent, /@veyl_sources_v1/);
  assert.match(docContent, /@veyl_digests_v1/);
  assert.match(docContent, /@veyl_settings_v1/);

  const digestCode = fs.readFileSync(digestRepoPath, 'utf8');
  assert.match(digestCode, /@veyl_digests_v1/);

  const sourceCode = fs.readFileSync(sourceRepoPath, 'utf8');
  assert.match(sourceCode, /@veyl_sources_v1/);

  const settingsCode = fs.readFileSync(settingsRepoPath, 'utf8');
  assert.match(settingsCode, /@veyl_settings_v1/);
});
