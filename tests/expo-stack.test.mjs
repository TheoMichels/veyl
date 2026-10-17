import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('AC-01 & AC-02: package.json configure la stack Expo SDK, les dépendances socle et les scripts cibles normés', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json doit exister');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const scripts = pkg.scripts || {};

  // Dépendances Expo et socle obligatoires
  for (const requiredDep of [
    'expo',
    'react-native',
    'react-native-web',
    'expo-linear-gradient',
    'react-native-svg',
    'zod',
    'expo-constants',
    '@react-native-async-storage/async-storage',
  ]) {
    assert.ok(
      deps[requiredDep],
      `La dépendance "${requiredDep}" doit être présente dans dependencies de package.json`
    );
  }

  assert.ok(
    devDeps['serve'],
    'La dépendance "serve" doit être présente dans devDependencies de package.json'
  );

  // Absence de Next.js dans dependencies
  assert.equal(
    deps.next,
    undefined,
    'La dépendance "next" ne doit plus figurer dans dependencies de package.json'
  );

  // Scripts cibles normés exacts
  const expectedScripts = {
    web: 'expo start --web --port 8081',
    build: 'EXPO_NO_TELEMETRY=1 expo export -p web --clear',
    preview: 'serve dist --listen 4173',
    typecheck: 'tsc --noEmit',
    lint: 'expo lint',
    test: 'node --test tests/*.test.mjs',
    'test:e2e': 'playwright test',
    postinstall: 'prisma generate',
    'db:deploy': 'node scripts/deploy-db.mjs',
    'db:studio': 'prisma studio',
  };

  for (const [scriptName, expectedCmd] of Object.entries(expectedScripts)) {
    assert.equal(
      scripts[scriptName],
      expectedCmd,
      `Le script "${scriptName}" doit valoir exactement "${expectedCmd}"`
    );
  }
});

test('AC-03: app.config.js injecte dynamiquement extra.storageMode', async () => {
  const configPath = path.join(rootDir, 'app.config.js');
  assert.ok(fs.existsSync(configPath), 'app.config.js doit exister à la racine du projet');

  const configFn = (await import(`file://${configPath}`)).default;
  assert.equal(typeof configFn, 'function', 'app.config.js doit exporter une fonction de configuration');

  // Mode local par défaut hors Vercel
  const localConfig = configFn({ config: { extra: {} } });
  assert.equal(localConfig.extra.storageMode, 'local');

  // Mode cloud simulé Vercel production
  const origVercel = process.env.VERCEL;
  const origVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL = '1';
    delete process.env.VERCEL_ENV;
    const cloudConfig = configFn({ config: { extra: {} } });
    assert.equal(cloudConfig.extra.storageMode, 'supabase');
  } finally {
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    else delete process.env.VERCEL;
    if (origVercelEnv !== undefined) process.env.VERCEL_ENV = origVercelEnv;
    else delete process.env.VERCEL_ENV;
  }
});

test('AC-04: scripts/deploy-db.mjs existe et valide la présence de DIRECT_URL', async () => {
  const deployScriptPath = path.join(rootDir, 'scripts', 'deploy-db.mjs');
  assert.ok(fs.existsSync(deployScriptPath), 'scripts/deploy-db.mjs doit exister');

  const deployMod = await import(`file://${deployScriptPath}`);
  assert.equal(typeof deployMod.deployDatabase, 'function', 'scripts/deploy-db.mjs doit exporter deployDatabase');

  assert.throws(
    () => deployMod.deployDatabase({}),
    /DIRECT_URL ou POSTGRES_URL_NON_POOLING est requis/,
    'deployDatabase doit lever une erreur explicite sans DIRECT_URL'
  );
});

test('AC-05: Nettoyage SQLite — aucun résidu de scripts ou base SQLite locale', () => {
  const obsoleteFiles = [
    'scripts/setup-local-db.mjs',
    'scripts/local-server.mjs',
    'scripts/dev-web.mjs',
    'scripts/test-db-local.mjs',
    'prisma/schema.local.prisma',
    'prisma/dev.db',
  ];

  for (const file of obsoleteFiles) {
    const fullPath = path.join(rootDir, file);
    assert.equal(
      fs.existsSync(fullPath),
      false,
      `Le fichier obsolète SQLite "${file}" doit être supprimé`
    );
  }
});

test('AC-01: app.json configure Expo Web avec bundler Metro et langue fr', () => {
  const appJsonPath = path.join(rootDir, 'app.json');
  assert.ok(fs.existsSync(appJsonPath), 'app.json doit exister à la racine du projet');

  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const expoConfig = appConfig.expo;
  assert.ok(expoConfig, 'app.json doit contenir une clé racine "expo"');
  assert.ok(expoConfig.web, 'app.json doit contenir la configuration "expo.web"');
  assert.equal(expoConfig.web.bundler, 'metro', 'expo.web.bundler doit être configuré sur "metro"');
  assert.equal(expoConfig.web.lang, 'fr', 'expo.web.lang doit être configuré sur "fr"');
});

test('AC-08: prisma/schema.prisma, .gitignore et vercel.json préservent la compatibilité Vercel & PostgreSQL', () => {
  // 1. prisma/schema.prisma
  const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
  assert.ok(fs.existsSync(schemaPath), 'prisma/schema.prisma doit exister');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  assert.match(
    schemaContent,
    /provider\s*=\s*"postgresql"/,
    'prisma/schema.prisma doit conserver provider = "postgresql"'
  );
  assert.match(
    schemaContent,
    /directUrl\s*=\s*env\("DIRECT_URL"\)/,
    'prisma/schema.prisma doit conserver directUrl = env("DIRECT_URL")'
  );

  // 2. .gitignore
  const gitignorePath = path.join(rootDir, '.gitignore');
  assert.ok(fs.existsSync(gitignorePath), '.gitignore doit exister');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert.ok(
    gitignoreContent.includes('prisma/*.db') || gitignoreContent.includes('prisma/dev.db'),
    '.gitignore doit ignorer prisma/dev.db (ou prisma/*.db)'
  );
  assert.ok(
    gitignoreContent.includes('prisma/schema.local.prisma'),
    '.gitignore doit ignorer prisma/schema.local.prisma'
  );
  assert.ok(
    gitignoreContent.includes('.agents/state'),
    '.gitignore doit ignorer .agents/state/'
  );
  assert.ok(
    gitignoreContent.includes('dist'),
    '.gitignore doit ignorer dist/'
  );

  // 3. vercel.json
  const vercelPath = path.join(rootDir, 'vercel.json');
  assert.ok(fs.existsSync(vercelPath), 'vercel.json doit exister');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  assert.equal(
    vercelConfig.outputDirectory,
    'dist',
    'vercel.json doit définir outputDirectory: "dist"'
  );
  assert.ok(Array.isArray(vercelConfig.crons), 'vercel.json doit définir un tableau "crons"');
  const cronPaths = vercelConfig.crons.map((c) => c.path);
  for (const expectedCron of ['/api/cron/ia', '/api/cron/luxembourg', '/api/cron/tech']) {
    assert.ok(
      cronPaths.includes(expectedCron),
      `vercel.json doit contenir le cron "${expectedCron}"`
    );
  }
});

test('AC-02 & L2: src/theme/colors.ts expose la structure complète des tokens conforme à stack-target.md §2', async () => {
  const colorsPath = path.join(rootDir, 'src', 'theme', 'colors.ts');
  assert.ok(fs.existsSync(colorsPath), 'src/theme/colors.ts doit exister');

  const colorsContent = fs.readFileSync(colorsPath, 'utf8');
  assert.match(colorsContent, /export\s+function\s+getThemeColors/, 'getThemeColors doit être exporté');
  assert.match(colorsContent, /export\s+function\s+getThemeGradient/, 'getThemeGradient doit être exporté');
  assert.match(colorsContent, /export\s+const\s+gradient\s*=/, 'gradient doit être exporté');
  assert.match(colorsContent, /export\s+const\s+colors\s*=/, 'colors doit être exporté');
  assert.match(colorsContent, /export\s+const\s+radius\s*=/, 'radius doit être exporté');
  assert.match(colorsContent, /export\s+const\s+shadows\s*=/, 'shadows doit être exporté');

  let mod = null;
  try {
    mod = await import(path.FileUrl ? path.FileUrl(colorsPath) : `file://${colorsPath}`);
  } catch {
    mod = null;
  }

  if (mod && typeof mod.getThemeColors === 'function' && typeof mod.getThemeGradient === 'function') {
    const light = mod.getThemeColors('light');
    const dark = mod.getThemeColors('dark');
    assert.equal(light.mode, 'light');
    assert.equal(dark.mode, 'dark');
    assert.equal(light.primary, '#4F46E5', 'Le primary clair doit être Indigo #4F46E5');
    assert.equal(light.accentViolet, '#7C3AED', 'L’accent clair doit être Violet #7C3AED');
    assert.equal(dark.primary, '#6366F1', 'Le primary sombre doit être Indigo #6366F1');
    assert.equal(dark.accentViolet, '#8B5CF6', 'L’accent sombre doit être Violet #8B5CF6');
    assert.notEqual(light.background, dark.background, 'Le fond clair et sombre doivent être distincts');

    const lightGrad = mod.getThemeGradient('light');
    const darkGrad = mod.getThemeGradient('dark');
    assert.equal(lightGrad.length, 3);
    assert.equal(darkGrad.length, 3);
    assert.notDeepEqual(lightGrad, darkGrad);

    // Vérification des tokens §2 obligatoires
    assert.ok(mod.gradient && Array.isArray(mod.gradient.colors), 'gradient.colors doit être un tableau');
    assert.equal(mod.gradient.colors.length, 4, 'gradient doit comporter 4 teintes proches');
    assert.ok(mod.colors, 'colors doit être exporté');
    assert.equal(mod.colors.brand, '#4F46E5', 'colors.brand doit valoir #4F46E5');
    assert.ok(mod.colors.panel, 'colors.panel doit être défini');
    assert.ok(mod.radius, 'radius doit être exporté');
    assert.equal(mod.radius.sm, 12, 'radius.sm doit valoir 12');
    assert.equal(mod.radius.md, 16, 'radius.md doit valoir 16');
    assert.equal(mod.radius.lg, 20, 'radius.lg doit valoir 20');
    assert.equal(mod.radius.xl, 24, 'radius.xl doit valoir 24');
    assert.ok(mod.shadows && mod.shadows.sm, 'shadows.sm doit être défini');
    assert.ok(mod.shadows.md, 'shadows.md doit être défini');
    assert.ok(mod.shadows.lg, 'shadows.lg doit être défini');
  } else {
    assert.match(colorsContent, /primary:\s*'#4F46E5'/);
    assert.match(colorsContent, /accentViolet:\s*'#7C3AED'/);
    assert.match(colorsContent, /primary:\s*'#6366F1'/);
    assert.match(colorsContent, /accentViolet:\s*'#8B5CF6'/);
    assert.match(colorsContent, /brand:\s*'#4F46E5'/);
    assert.match(colorsContent, /panel:\s*'rgba\(255,\s*255,\s*255,\s*0\.82\)'/);
    assert.match(colorsContent, /sm:\s*12/);
  }
});
