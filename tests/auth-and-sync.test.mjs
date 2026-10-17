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

test('L5 & AC-05: authService renvoie des erreurs françaises pour les codes Supabase connus', async () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: async ({ password }) => {
        if (password === 'badpassword') {
          return {
            data: { user: null, session: null },
            error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
          };
        }
        if (password === 'weakpass') {
          return {
            data: { user: null, session: null },
            error: { code: 'weak_password', message: 'Password is weak' },
          };
        }
        if (password === 'ratelimited_req') {
          return {
            data: { user: null, session: null },
            error: { code: 'over_request_rate_limit', message: 'Too many requests' },
          };
        }
        if (password === 'ratelimited_mail') {
          return {
            data: { user: null, session: null },
            error: { code: 'over_email_send_rate_limit', message: 'Rate limit on emails' },
          };
        }
        return { data: { user: null, session: null }, error: null };
      },
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

  const resWeak = await authMod.signIn('user@test.com', 'weakpass');
  assert.equal(resWeak.error?.message, 'Choisissez un mot de passe plus robuste.');

  const resRateLimitReq = await authMod.signIn('user@test.com', 'ratelimited_req');
  assert.equal(resRateLimitReq.error?.message, 'Trop de tentatives. Patientez quelques instants puis réessayez.');

  const resRateLimitMail = await authMod.signIn('user@test.com', 'ratelimited_mail');
  assert.equal(resRateLimitMail.error?.message, 'Trop de tentatives. Patientez quelques instants puis réessayez.');
});

test('AC-03: clearLocalCache supprime toutes les clés commençant par @veyl_ dans AsyncStorage et localStorage', async () => {
  const asyncStorageState = {
    '@veyl_digests_v1': '[{"id":"1"}]',
    '@veyl_sources_v1': '[{"id":"2"}]',
    '@veyl_settings_v1': '{"id":"3"}',
    'other_app_token': 'keep-me',
  };

  const removedAsyncKeys = [];
  const mockAsyncStorage = {
    getAllKeys: async () => Object.keys(asyncStorageState),
    removeMany: async (keys) => {
      removedAsyncKeys.push(...keys);
      for (const k of keys) {
        delete asyncStorageState[k];
      }
    },
    multiRemove: async (keys) => {
      removedAsyncKeys.push(...keys);
      for (const k of keys) {
        delete asyncStorageState[k];
      }
    },
  };

  const localStorageMap = new Map([
    ['@veyl_digests_v1', 'digest-data'],
    ['@veyl_auth_token', 'auth-data'],
    ['other_unrelated_key', 'unrelated-data'],
  ]);

  const mockLocalStorage = {
    get length() {
      return localStorageMap.size;
    },
    key: (i) => Array.from(localStorageMap.keys())[i] ?? null,
    removeItem: (key) => {
      localStorageMap.delete(key);
    },
  };

  const syncMod = loadTypeScript(
    'src/services/syncService.ts',
    {
      './supabaseClient': { supabase: null },
      'react-native': { Platform: { OS: 'web' } },
      'expo-constants': { expoConfig: { extra: { storageMode: 'local' } } },
      '@react-native-async-storage/async-storage': mockAsyncStorage,
    },
    {
      window: { localStorage: mockLocalStorage },
    }
  );

  await syncMod.clearLocalCache();

  // Vérification AsyncStorage
  assert.equal(asyncStorageState['@veyl_digests_v1'], undefined);
  assert.equal(asyncStorageState['@veyl_sources_v1'], undefined);
  assert.equal(asyncStorageState['@veyl_settings_v1'], undefined);
  assert.equal(asyncStorageState['other_app_token'], 'keep-me');
  assert.deepEqual(removedAsyncKeys.sort(), ['@veyl_digests_v1', '@veyl_settings_v1', '@veyl_sources_v1']);

  // Vérification localStorage
  assert.equal(localStorageMap.has('@veyl_digests_v1'), false);
  assert.equal(localStorageMap.has('@veyl_auth_token'), false);
  assert.equal(localStorageMap.has('other_unrelated_key'), true);
});

test('AC-01 & AC-03: useAuth ne modifie pas isLoading lors de signIn, signUp ou signOut et purge le cache', async () => {
  let authCallback = null;
  let clearLocalCacheCount = 0;

  const mockAuthService = {
    getSession: async () => ({ user: { id: 'user-init' } }),
    onAuthStateChange: (cb) => {
      authCallback = cb;
      return { unsubscribe: () => {} };
    },
    signIn: async () => ({
      user: { id: 'user-signin' },
      session: { user: { id: 'user-signin' } },
      error: null,
    }),
    signUp: async () => ({
      user: { id: 'user-signup' },
      session: { user: { id: 'user-signup' } },
      error: null,
    }),
    signOut: async () => ({ error: null }),
  };

  const mockSyncService = {
    clearLocalCache: async () => {
      clearLocalCacheCount++;
    },
  };

  const useAuthMod = loadTypeScript(
    'src/hooks/useAuth.ts',
    {
      '../config/storageMode': { isLocalMode: false },
      '../services/authService': mockAuthService,
      '../services/syncService': mockSyncService,
      react: {
        useCallback: (fn) => fn,
        useEffect: () => {},
        useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
      },
    }
  );

  // Attendre l'initAuth
  await new Promise((resolve) => setTimeout(resolve, 25));

  const auth = useAuthMod.useAuth();
  assert.equal(auth.isLoading, false, 'isLoading doit être résolu à false après l init');

  // Test signIn : isLoading reste false
  const signInRes = await auth.signIn('test@veyl.com', 'password123');
  assert.equal(signInRes.success, true);
  const authAfterSignIn = useAuthMod.useAuth();
  assert.equal(authAfterSignIn.isLoading, false, 'isLoading ne doit pas être altéré par signIn');

  // Test signUp : isLoading reste false
  const signUpRes = await auth.signUp('test2@veyl.com', 'password123');
  assert.equal(signUpRes.success, true);
  const authAfterSignUp = useAuthMod.useAuth();
  assert.equal(authAfterSignUp.isLoading, false, 'isLoading ne doit pas être altéré par signUp');

  // Test signOut : clearLocalCache est appelé, isLoading reste false
  await auth.signOut();
  assert.equal(clearLocalCacheCount, 1, 'signOut doit appeler clearLocalCache()');
  const authAfterSignOut = useAuthMod.useAuth();
  assert.equal(authAfterSignOut.isLoading, false, 'isLoading ne doit pas être repassé à true lors de signOut');

  // Test SIGNED_OUT externe : clearLocalCache est appelé
  if (authCallback) {
    authCallback(null, null, 'SIGNED_OUT');
    assert.equal(clearLocalCacheCount, 2, 'L événement SIGNED_OUT doit appeler clearLocalCache()');
  }
});

test('L5: syncService gère les synchronisations en toute sécurité', async () => {
  const syncMod = loadTypeScript(
    'src/services/syncService.ts',
    {
      './supabaseClient': { supabase: null },
      'react-native': { Platform: { OS: 'web' } },
      'expo-constants': { expoConfig: { extra: { storageMode: 'local' } } },
      '@react-native-async-storage/async-storage': {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
        getAllKeys: async () => [],
        multiRemove: async () => {},
      },
    }
  );

  assert.ok(syncMod.pullFromCloud, 'pullFromCloud doit être exporté');
  assert.ok(syncMod.pushToCloud, 'pushToCloud doit être exporté');
  assert.ok(syncMod.syncAll, 'syncAll doit être exporté');
  assert.ok(syncMod.clearLocalCache, 'clearLocalCache doit être exporté');

  const pullRes = await syncMod.pullFromCloud('test-user-id');
  assert.equal(pullRes.success, false);
  assert.match(pullRes.error, /Client Supabase/);
});

test('AC-04: App.tsx implémente la garde d authentification stack-target.md §5 et isole MainApp', () => {
  const appPath = path.join(rootDir, 'App.tsx');
  assert.ok(fs.existsSync(appPath), 'App.tsx doit exister');
  const appContent = fs.readFileSync(appPath, 'utf8');

  assert.match(appContent, /auth-loading-screen/, 'App.tsx doit contenir le testID auth-loading-screen');
  assert.match(appContent, /auth-loading-spinner/, 'App.tsx doit contenir le spinner de chargement de session');
  assert.match(appContent, /<AuthScreen\s*\/>/, 'App.tsx doit rendre AuthScreen');
  assert.match(appContent, /pullFromCloud/, 'App.tsx doit appeler pullFromCloud pour synchroniser les données utilisateur');
  assert.match(appContent, /isPulling/, 'App.tsx doit gérer le statut isPulling');
  assert.match(appContent, /pulledFor/, 'App.tsx doit mémoriser pulledFor.current');
  assert.match(appContent, /<MainApp\s+key=\{user\?\.id\s*\?\?\s*['"]local['"]\}/, 'App.tsx doit isoler le dashboard dans MainApp avec key={user?.id ?? "local"}');
  assert.match(appContent, /isLoading\s*\|\|\s*isPulling/, 'App.tsx doit afficher LoadingScreen si isLoading || isPulling');
});

test('AC-05: AuthScreen.tsx est structuré avec tabs, validation, banner non configuré et aucun as any', () => {
  const authScreenPath = path.join(rootDir, 'src', 'components', 'AuthScreen.tsx');
  assert.ok(fs.existsSync(authScreenPath), 'src/components/AuthScreen.tsx doit exister');
  const content = fs.readFileSync(authScreenPath, 'utf8');

  // Aucun "as any"
  assert.doesNotMatch(content, /as\s+any/, 'AuthScreen.tsx ne doit contenir aucun "as any"');

  // TestIDs obligatoires
  assert.match(content, /testID="auth-screen"/);
  assert.match(content, /testID="auth-tab-signin"/);
  assert.match(content, /testID="auth-tab-signup"/);
  assert.match(content, /testID="auth-email-input"/);
  assert.match(content, /testID="auth-password-input"/);
  assert.match(content, /testID="auth-submit-btn"/);
  assert.match(content, /testID="auth-error-banner"/);
  assert.match(content, /testID="auth-success-banner"/);
  assert.match(content, /testID="auth-unconfigured-banner"/, 'AuthScreen.tsx doit contenir testID="auth-unconfigured-banner"');

  // Couleurs et branding Veyl
  assert.match(content, /#4F46E5/);
  assert.match(content, /#6366F1/);
  assert.match(content, /#9333EA/);
  assert.match(content, /Veille Stratégique & Technologique/);
});

test('AC-05: pullFromCloud ordonne les digests par date décroissante et les sources par nom alphabétique', async () => {
  const writtenStorage = {};
  const mockStorage = {
    getItem: async (key) => writtenStorage[key] || null,
    setItem: async (key, value) => {
      writtenStorage[key] = value;
    },
    removeItem: async (key) => {
      delete writtenStorage[key];
    },
    getAllKeys: async () => Object.keys(writtenStorage),
    multiRemove: async (keys) => {
      for (const k of keys) delete writtenStorage[k];
    },
  };

  const rawDigests = [
    {
      id: 'dig-old',
      user_id: 'test-user',
      category: 'IA',
      title: 'Ancienne synthèse',
      content: 'Contenu ancien',
      created_at: '2026-10-01T10:00:00.000Z',
    },
    {
      id: 'dig-new',
      user_id: 'test-user',
      category: 'Tech',
      title: 'Nouvelle synthèse',
      content: 'Contenu récent',
      created_at: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'dig-mid',
      user_id: 'test-user',
      category: 'Luxembourg',
      title: 'Synthèse intermédiaire',
      content: 'Contenu intermédiaire',
      created_at: '2026-10-10T10:00:00.000Z',
    },
  ];

  const rawSources = [
    {
      id: 'src-z',
      user_id: 'test-user',
      name: 'Zeta News',
      url: 'https://zeta.example.com/rss',
      category: 'Tech',
      is_active: true,
    },
    {
      id: 'src-a',
      user_id: 'test-user',
      name: 'Alpha AI',
      url: 'https://alpha.example.com/rss',
      category: 'IA',
      is_active: true,
    },
  ];

  const mockSupabase = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: table === 'digests' ? rawDigests : rawSources,
            error: null,
          }),
          maybeSingle: () => Promise.resolve({
            data: {
              user_id: 'test-user',
              gemini_prompt_ia: 'P-IA',
              gemini_prompt_lux: 'P-LUX',
              gemini_prompt_tech: 'P-TECH',
              cron_enabled: true,
            },
            error: null,
          }),
        }),
      }),
    }),
  };

  const syncMod = loadTypeScript(
    'src/services/syncService.ts',
    {
      './supabaseClient': { supabase: mockSupabase },
      'react-native': { Platform: { OS: 'web' } },
      'expo-constants': { expoConfig: { extra: { storageMode: 'supabase' } } },
      '@react-native-async-storage/async-storage': mockStorage,
    }
  );

  const res = await syncMod.pullFromCloud('test-user');
  assert.equal(res.success, true);

  // Vérification de l'ordonnancement des digests (décroissant par date)
  const storedDigests = JSON.parse(writtenStorage['@veyl_digests_v1']);
  assert.equal(storedDigests.length, 3);
  assert.equal(storedDigests[0].id, 'dig-new');
  assert.equal(storedDigests[1].id, 'dig-mid');
  assert.equal(storedDigests[2].id, 'dig-old');

  // Vérification de l'ordonnancement des sources (alphabétique)
  const storedSources = JSON.parse(writtenStorage['@veyl_sources_v1']);
  assert.equal(storedSources.length, 2);
  assert.equal(storedSources[0].name, 'Alpha AI');
  assert.equal(storedSources[1].name, 'Zeta News');
});

test('AC-06: Header.tsx intègre le badge connecté vert et le bouton de déconnexion', () => {
  const headerPath = path.join(rootDir, 'src', 'components', 'Header.tsx');
  assert.ok(fs.existsSync(headerPath), 'src/components/Header.tsx doit exister');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  assert.match(headerContent, /testID="header-signout-btn"/);
  assert.match(headerContent, /testID="cloud-user-badge"/);
  assert.match(headerContent, /signOut\(\)/);
  assert.match(headerContent, /colors\.positiveSoft/);
});
