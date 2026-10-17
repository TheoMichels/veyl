import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('AC-07: Module de validation Zod (src/utils/validation.ts) — cas nominaux et limites', async () => {
  const validationPath = path.join(rootDir, 'src', 'utils', 'validation.ts');
  assert.ok(
    fs.existsSync(validationPath),
    'Le fichier src/utils/validation.ts doit exister pour valider les entrées avec Zod'
  );

  const validationMod = await import(`file://${validationPath}`);
  const {
    createSourceSchema,
    toggleSourceSchema,
    deleteSourceSchema,
    goFurtherSchema,
    updateSettingsSchema,
  } = validationMod;

  assert.ok(createSourceSchema, 'Un schéma Zod pour la création de Source doit être exporté');
  assert.ok(toggleSourceSchema, 'Un schéma Zod pour la modification de statut de Source doit être exporté');
  assert.ok(deleteSourceSchema, 'Un schéma Zod pour la suppression de Source doit être exporté');
  assert.ok(goFurtherSchema, 'Un schéma Zod pour go-further doit être exporté');
  assert.ok(updateSettingsSchema, 'Un schéma Zod pour Settings doit être exporté');

  // Cas nominal Source
  const validSource = createSourceSchema.safeParse({
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'IA',
  });
  assert.equal(validSource.success, true, 'Une source valide doit être acceptée par Zod');

  // Cas limite 1 : Nom vide ou espaces
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

  // Cas nominal et limites toggleSourceSchema
  const validToggle = toggleSourceSchema.safeParse({ id: 'src-123', isActive: false });
  assert.equal(validToggle.success, true);
  const invalidToggle = toggleSourceSchema.safeParse({ id: '', isActive: false });
  assert.equal(invalidToggle.success, false);

  // Cas nominal et limites deleteSourceSchema
  const validDelete = deleteSourceSchema.safeParse({ id: 'src-123' });
  assert.equal(validDelete.success, true);
  const invalidDelete = deleteSourceSchema.safeParse({ id: '  ' });
  assert.equal(invalidDelete.success, false);

  // Cas nominal et limites goFurtherSchema
  const validGoFurther = goFurtherSchema.safeParse({ text: 'Nouvelles puces neuromorphiques' });
  assert.equal(validGoFurther.success, true);
  const emptyGoFurther = goFurtherSchema.safeParse({ text: '   ' });
  assert.equal(emptyGoFurther.success, false, 'Un texte vide pour go-further doit être rejeté');

  // Cas nominal et limites updateSettingsSchema
  const validSettings = updateSettingsSchema.safeParse({
    geminiPromptIA: 'Prompt IA valide et suffisamment long pour les tests',
    geminiPromptLux: 'Prompt Luxembourg valide pour les tests',
    geminiPromptTech: 'Prompt Tech valide pour les tests',
    cronEnabled: true,
  });
  assert.equal(validSettings.success, true);

  const invalidSettings = updateSettingsSchema.safeParse({
    geminiPromptIA: '   ',
    geminiPromptLux: '',
    geminiPromptTech: '',
  });
  assert.equal(invalidSettings.success, false, 'Des prompts vides doivent être rejetés');
});

test('AC-04 & AC-05: Modèle de données Prisma PostgreSQL préservé sans modèle SQLite', () => {
  const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
  assert.ok(fs.existsSync(schemaPath), 'prisma/schema.prisma doit exister');

  const content = fs.readFileSync(schemaPath, 'utf8');
  assert.match(content, /provider\s*=\s*"postgresql"/);
  assert.match(content, /model\s+Digest\s+{/);
  assert.match(content, /model\s+Source\s+{/);
  assert.match(content, /model\s+Settings\s+{/);

  // Absence totale de sqlite
  assert.equal(content.includes('sqlite'), false, 'prisma/schema.prisma ne doit pas contenir sqlite');
});
