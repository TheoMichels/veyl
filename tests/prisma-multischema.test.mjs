import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('L4: prisma/schema.prisma est configuré en multiSchema veyl et auth', () => {
  const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
  assert.ok(fs.existsSync(schemaPath), 'prisma/schema.prisma doit exister');

  const content = fs.readFileSync(schemaPath, 'utf8');
  assert.match(content, /schemas\s*=\s*\["veyl",\s*"auth"\]/);
  assert.match(content, /previewFeatures\s*=\s*\["multiSchema"\]/);
  assert.match(content, /@@schema\("veyl"\)/);
  assert.match(content, /@map\("user_id"\)/);
  assert.match(content, /@map\("created_at"\)/);
  assert.match(content, /@map\("updated_at"\)/);
  assert.match(content, /@@map\("digests"\)/);
  assert.match(content, /@@map\("sources"\)/);
  assert.match(content, /@@map\("user_settings"\)/);
});

test('L4: Migration SQL veyl_multischema contient RLS 100%, FK auth.users et triggers', () => {
  const migrationPath = path.join(
    rootDir,
    'prisma',
    'migrations',
    '20261016120000_veyl_multischema',
    'migration.sql'
  );
  assert.ok(fs.existsSync(migrationPath), 'La migration SQL cible multiSchema doit exister');

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Schéma et permissions
  assert.match(sql, /CREATE SCHEMA IF NOT EXISTS veyl;/);
  assert.match(sql, /GRANT USAGE ON SCHEMA veyl TO anon, authenticated, service_role;/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION veyl\.set_updated_at\(\)/);

  // RLS et FK sur les 3 tables
  for (const table of ['digests', 'sources', 'user_settings']) {
    assert.match(sql, new RegExp(`ALTER TABLE veyl\\.${table} ENABLE ROW LEVEL SECURITY;`));
    assert.match(sql, new RegExp(`REFERENCES auth\\.users\\(id\\) ON DELETE CASCADE`));
    assert.match(sql, new RegExp(`CREATE TRIGGER trg_${table}_updated_at`));
    assert.match(sql, new RegExp(`CREATE POLICY ${table}_select_policy ON veyl\\.${table}`));
    assert.match(sql, new RegExp(`CREATE POLICY ${table}_insert_policy ON veyl\\.${table}`));
    assert.match(sql, new RegExp(`CREATE POLICY ${table}_update_policy ON veyl\\.${table}`));
    assert.match(sql, new RegExp(`CREATE POLICY ${table}_delete_policy ON veyl\\.${table}`));
  }
});
