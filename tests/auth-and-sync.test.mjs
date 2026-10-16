import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const rootDir = process.cwd();

test('L5: src/types/database.ts contient le schéma veyl et ses tables', () => {
  const dbTypesPath = path.join(rootDir, 'src', 'types', 'database.ts');
  assert.ok(fs.existsSync(dbTypesPath), 'src/types/database.ts doit exister');

  const content = fs.readFileSync(dbTypesPath, 'utf8');
  assert.match(content, /veyl:\s*{\s*Tables:\s*{/);
  assert.match(content, /digests:\s*{/);
  assert.match(content, /sources:\s*{/);
  assert.match(content, /user_settings:\s*{/);
});

test('L5: supabaseClient reste null en mode local même avec clés factices', () => {
  const mod = loadTypeScript(
    'src/services/supabaseClient.ts',
    {
      'react-native': { Platform: { OS: 'web' } },
      '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
      '../config/storageMode': { isLocalMode: true, storageMode: 'local' },
      '../config/supabase': { isSupabaseConfigured: true, supabaseUrl: 'https://synthetic.supabase.co', supabaseAnonKey: 'anon-key' },
      '@supabase/supabase-js': { createClient: () => ({ auth: {}, from: () => {} }) },
    }
  );

  assert.equal(mod.supabase, null, 'Le client Supabase doit être null en mode local');
});

test('L5: authService renvoie des erreurs françaises pour les codes Supabase connus', async () => {
  let signInError = null;
  const mockSupabase = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { code: 'user_already_exists', message: 'User already registered' },
      }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };

  const authMod = loadTypeScript(
    'src/services/authService.ts',
    {
      './supabaseClient': { supabase: mockSupabase },
    }
  );

  const resSignIn = await authMod.signIn('user@test.com', 'badpassword');
  assert.equal(resSignIn.user, null);
  assert.equal(resSignIn.error?.message, 'Adresse e-mail ou mot de passe incorrect.');

  const resSignUp = await authMod.signUp('user@test.com', 'password123');
  assert.equal(resSignUp.user, null);
  assert.equal(resSignUp.error?.message, 'Un compte existe déjà avec cette adresse e-mail.');
});

test('L5: syncService gère les synchronisations en toute sécurité', async () => {
  const syncMod = loadTypeScript(
    'src/services/syncService.ts',
    {
      './supabaseClient': { supabase: null },
      '@react-native-async-storage/async-storage': {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      },
    }
  );

  assert.ok(syncMod.pullFromCloud, 'pullFromCloud doit être exporté');
  assert.ok(syncMod.pushToCloud, 'pushToCloud doit être exporté');
  assert.ok(syncMod.syncAll, 'syncAll doit être exporté');

  const pullRes = await syncMod.pullFromCloud('test-user-id');
  assert.equal(pullRes.success, false);
  assert.match(pullRes.error, /Client Supabase/);
});
