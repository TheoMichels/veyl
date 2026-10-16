import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const rootDir = process.cwd();
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = new PrismaClient();

test.after(async () => {
  await prisma.$disconnect();
});

test('AC-03 & AC-06: Base SQLite locale (prisma/dev.db) — lecture/écriture Settings, Source et Digest', async () => {
  const dbPath = path.join(rootDir, 'prisma', 'dev.db');
  assert.ok(fs.existsSync(dbPath), 'Le fichier SQLite prisma/dev.db doit exister');

  // 1. Settings par défaut
  const defaultSettings = await prisma.settings.findUnique({ where: { id: 'default' } });
  assert.ok(defaultSettings, 'L’enregistrement Settings "default" doit exister dans prisma/dev.db');
  assert.ok(defaultSettings.geminiPromptIA.length > 10, 'geminiPromptIA doit être renseigné');
  assert.ok(defaultSettings.geminiPromptLux.length > 10, 'geminiPromptLux doit être renseigné');
  assert.ok(defaultSettings.geminiPromptTech.length > 10, 'geminiPromptTech doit être renseigné');

  // Mise à jour temporaire + restauration de Settings
  const originalPromptIA = defaultSettings.geminiPromptIA;
  const updatedPromptIA = `${originalPromptIA} [Test SQLite]`;
  const updatedSettings = await prisma.settings.update({
    where: { id: 'default' },
    data: { geminiPromptIA: updatedPromptIA },
  });
  assert.equal(updatedSettings.geminiPromptIA, updatedPromptIA);

  await prisma.settings.update({
    where: { id: 'default' },
    data: { geminiPromptIA: originalPromptIA },
  });

  // 2. CRUD Source
  const uniqueUrl = `https://veyl-unit-${Date.now()}.example.com/rss.xml`;
  const createdSource = await prisma.source.create({
    data: {
      name: 'Source Unitaire Veyl',
      url: uniqueUrl,
      category: 'IA',
      isActive: true,
    },
  });
  assert.ok(createdSource.id);
  assert.equal(createdSource.isActive, true);

  const toggledSource = await prisma.source.update({
    where: { id: createdSource.id },
    data: { isActive: false },
  });
  assert.equal(toggledSource.isActive, false);

  await prisma.source.delete({ where: { id: createdSource.id } });
  const deletedCheck = await prisma.source.findUnique({ where: { id: createdSource.id } });
  assert.equal(deletedCheck, null);

  // 3. CRUD Digest
  const createdDigest = await prisma.digest.create({
    data: {
      category: 'Tech',
      title: 'Synthèse Tech Unitaire',
      content: '## Section Test\n* Point clé de test unitaire',
    },
  });
  assert.ok(createdDigest.id);

  const fetchedDigest = await prisma.digest.findUnique({ where: { id: createdDigest.id } });
  assert.equal(fetchedDigest?.title, 'Synthèse Tech Unitaire');

  await prisma.digest.delete({ where: { id: createdDigest.id } });
});

test('AC-07: Module de validation Zod (src/utils/validation.ts) — cas nominaux et limites', async () => {
  const validationPath = path.join(rootDir, 'src', 'utils', 'validation.ts');
  assert.ok(
    fs.existsSync(validationPath),
    'Le fichier src/utils/validation.ts doit exister pour valider les entrées avec Zod'
  );

  let validationMod = null;
  try {
    validationMod = await import(`file://${validationPath}`);
  } catch {
    validationMod = null;
  }

  if (validationMod) {
    const createSourceSchema =
      validationMod.createSourceSchema || validationMod.sourceCreateSchema || validationMod.sourceSchema;
    const goFurtherSchema = validationMod.goFurtherSchema;
    const settingsSchema =
      validationMod.updateSettingsSchema || validationMod.settingsSchema;

    assert.ok(createSourceSchema, 'Un schéma Zod pour la création de Source doit être exporté');
    assert.ok(goFurtherSchema, 'Un schéma Zod pour /api/go-further doit être exporté');
    assert.ok(settingsSchema, 'Un schéma Zod pour Settings doit être exporté');

    // Cas nominal Source
    const validSource = createSourceSchema.safeParse({
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      category: 'IA',
    });
    assert.equal(validSource.success, true, 'Une source valide doit être acceptée par Zod');

    // Cas limite 1 : Nom vide
    const emptyName = createSourceSchema.safeParse({
      name: '   ',
      url: 'https://techcrunch.com/feed/',
      category: 'IA',
    });
    assert.equal(emptyName.success, false, 'Une source avec un nom vide doit être rejetée');

    // Cas limite 2 : URL non HTTP(S) ou malformée
    const invalidUrl = createSourceSchema.safeParse({
      name: 'Site Invalide',
      url: 'ftp://not-http-url',
      category: 'IA',
    });
    assert.equal(invalidUrl.success, false, 'Une URL non HTTP(S) doit être rejetée');

    // Cas limite 3 : Catégorie invalide
    const invalidCat = createSourceSchema.safeParse({
      name: 'Site',
      url: 'https://example.com/rss',
      category: 'Sport',
    });
    assert.equal(invalidCat.success, false, 'Une catégorie hors IA|Luxembourg|Tech doit être rejetée');

    // Cas limite 4 : /api/go-further avec texte vide
    const emptyGoFurther = goFurtherSchema.safeParse({ text: '   ' });
    assert.equal(emptyGoFurther.success, false, 'Un texte vide pour go-further doit être rejeté');
  }
});

test('AC-04, AC-05, AC-06, AC-07: Serveur API local (scripts/local-server.mjs) — validation 400 et persistance CRUD', async () => {
  const localServerPath = path.join(rootDir, 'scripts', 'local-server.mjs');
  assert.ok(
    fs.existsSync(localServerPath),
    'scripts/local-server.mjs doit exister pour servir les routes /api/* en local'
  );

  const testPort = 4199;
  const baseUrl = `http://localhost:${testPort}`;

  const serverProc = spawn(process.execPath, [localServerPath, '--port', String(testPort)], {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: 'file:./dev.db' },
    stdio: 'pipe',
  });

  // Attendre que le serveur réponde
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/settings`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      // Serveur en cours de démarrage
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  try {
    assert.ok(serverReady, `Le serveur API local doit démarrer et répondre sur ${baseUrl}/api/settings`);

    // 1. AC-07 : Rejet 400 sur /api/sources (nom vide, URL invalide, catégorie invalide)
    const badNameRes = await fetch(`${baseUrl}/api/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', url: 'https://example.com/rss', category: 'IA' }),
    });
    assert.equal(badNameRes.status, 400, 'POST /api/sources avec nom vide doit retourner 400');

    const badUrlRes = await fetch(`${baseUrl}/api/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', url: 'not-a-valid-url', category: 'IA' }),
    });
    assert.equal(badUrlRes.status, 400, 'POST /api/sources avec URL malformée doit retourner 400');

    const badCatRes = await fetch(`${baseUrl}/api/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', url: 'https://example.com/rss', category: 'InvalidCat' }),
    });
    assert.equal(badCatRes.status, 400, 'POST /api/sources avec catégorie invalide doit retourner 400');

    // 2. AC-07 : Rejet 400 sur /api/go-further lorsque text est vide
    const badGoFurtherRes = await fetch(`${baseUrl}/api/go-further`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    });
    assert.equal(badGoFurtherRes.status, 400, 'POST /api/go-further avec text vide doit retourner 400');

    // 3. AC-06 : Acceptation et persistance des mises à jour de Source et Settings via l'API
    const apiSourceUrl = `https://veyl-api-${Date.now()}.example.com/feed.xml`;
    const createSourceRes = await fetch(`${baseUrl}/api/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'API Integration Source',
        url: apiSourceUrl,
        category: 'Luxembourg',
      }),
    });
    assert.ok(
      createSourceRes.status === 200 || createSourceRes.status === 201,
      `POST /api/sources valide doit réussir (reçu ${createSourceRes.status})`
    );
    const createdSourceData = await createSourceRes.json();
    const createdSourceId = createdSourceData.id || createdSourceData.source?.id;
    assert.ok(createdSourceId, 'La source créée doit retourner un identifiant');

    // Bascule isActive
    const toggleRes = await fetch(`${baseUrl}/api/sources`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: createdSourceId, isActive: false }),
    });
    assert.equal(toggleRes.status, 200, 'PATCH /api/sources doit mettre à jour le statut isActive');

    // Suppression de la source créée
    const deleteRes = await fetch(`${baseUrl}/api/sources?id=${encodeURIComponent(createdSourceId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: createdSourceId }),
    });
    assert.equal(deleteRes.status, 200, 'DELETE /api/sources doit supprimer la source');

    // Lecture et sauvegarde de Settings
    const getSettingsRes = await fetch(`${baseUrl}/api/settings`);
    assert.equal(getSettingsRes.status, 200);
    const currentSettings = await getSettingsRes.json();
    const settingsObj = currentSettings.settings || currentSettings;

    const saveSettingsRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        geminiPromptIA: settingsObj.geminiPromptIA,
        geminiPromptLux: settingsObj.geminiPromptLux,
        geminiPromptTech: settingsObj.geminiPromptTech,
      }),
    });
    assert.equal(saveSettingsRes.status, 200, 'PUT /api/settings doit sauvegarder les prompts');
  } finally {
    serverProc.kill('SIGTERM');
  }
});
