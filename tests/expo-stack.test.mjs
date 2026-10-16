import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('AC-01: package.json configure la stack Expo SDK sans Next.js et expose les scripts unifiés', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json doit exister');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = pkg.dependencies || {};
  const scripts = pkg.scripts || {};

  // Dépendances Expo obligatoires
  for (const requiredDep of [
    'expo',
    'react-native',
    'react-native-web',
    'expo-linear-gradient',
    'react-native-svg',
    'zod',
  ]) {
    assert.ok(
      deps[requiredDep],
      `La dépendance "${requiredDep}" doit être présente dans dependencies de package.json`
    );
  }

  // Absence de Next.js dans dependencies
  assert.equal(
    deps.next,
    undefined,
    'La dépendance "next" ne doit plus figurer dans dependencies de package.json'
  );

  // Scripts obligatoires
  for (const requiredScript of [
    'web',
    'dev',
    'typecheck',
    'lint',
    'test',
    'test:unit',
    'test:e2e',
    'build',
  ]) {
    assert.ok(
      typeof scripts[requiredScript] === 'string' && scripts[requiredScript].trim().length > 0,
      `Le script "${requiredScript}" doit être défini dans package.json`
    );
  }

  assert.match(
    scripts.build,
    /expo export.*-p web/,
    'Le script "build" doit exporter le bundle web statique via "expo export -p web"'
  );
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

test('AC-02: src/theme/colors.ts expose getThemeColors et getThemeGradient (Clair/Sombre, palette Indigo/Violet)', async () => {
  const colorsPath = path.join(rootDir, 'src', 'theme', 'colors.ts');
  assert.ok(fs.existsSync(colorsPath), 'src/theme/colors.ts doit exister');

  const colorsContent = fs.readFileSync(colorsPath, 'utf8');
  assert.match(colorsContent, /export\s+function\s+getThemeColors/, 'getThemeColors doit être exporté');
  assert.match(colorsContent, /export\s+function\s+getThemeGradient/, 'getThemeGradient doit être exporté');

  // Vérification par import dynamique si Node supporte le stripping TS ou par inspection + évaluation
  let mod = null;
  try {
    mod = await import(path.FileUrl ? path.FileUrl(colorsPath) : `file://${colorsPath}`);
  } catch {
    // Fallback si la version de Node nécessite le contrôle sur le source TS directement
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
  } else {
    assert.match(colorsContent, /primary:\s*'#4F46E5'/);
    assert.match(colorsContent, /accentViolet:\s*'#7C3AED'/);
    assert.match(colorsContent, /primary:\s*'#6366F1'/);
    assert.match(colorsContent, /accentViolet:\s*'#8B5CF6'/);
  }
});
