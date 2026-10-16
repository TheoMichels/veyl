import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const schemaOfficialPath = path.join(rootDir, 'prisma', 'schema.prisma');
const schemaLocalPath = path.join(rootDir, 'prisma', 'schema.local.prisma');

console.log('🔄 [setup-local-db] Dérivation de prisma/schema.local.prisma depuis prisma/schema.prisma...');
let schemaContent = fs.readFileSync(schemaOfficialPath, 'utf8');

// Remplacement du bloc datasource PostgreSQL par SQLite
schemaContent = schemaContent.replace(
  /datasource\s+db\s*\{[\s\S]*?\}/,
  `datasource db {\n  provider = "sqlite"\n  url      = "file:./dev.db"\n}`
);

fs.writeFileSync(schemaLocalPath, schemaContent, 'utf8');
console.log('✅ [setup-local-db] prisma/schema.local.prisma généré avec succès.');

console.log('📦 [setup-local-db] Application du schéma SQLite vers prisma/dev.db...');
execSync('npx prisma db push --schema=prisma/schema.local.prisma --skip-generate', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: 'file:./dev.db' }
});

console.log('⚙️ [setup-local-db] Génération du client Prisma local...');
execSync('npx prisma generate --schema=prisma/schema.local.prisma', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: 'file:./dev.db' }
});

console.log('🔍 [setup-local-db] Vérification du paramétrage initial Settings...');
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:./dev.db' }
  }
});

async function ensureDefaultSettings() {
  try {
    const existing = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!existing) {
      await prisma.settings.create({
        data: {
          id: 'default',
          geminiPromptIA: 'Tu es un expert en intelligence artificielle. Résume les actualités et nouveautés IA marquantes avec des puces claires et concises.',
          geminiPromptLux: 'Tu es un veilleur marché IT au Luxembourg. Résume les opportunités, entreprises, et dynamiques du secteur IT luxembourgeois.',
          geminiPromptTech: 'Tu es un journaliste tech. Résume les nouveautés matérielles (hardware) et logicielles (software). Structure avec des puces et ajoute les liens sources.',
          cronEnabled: true
        }
      });
      console.log('✨ [setup-local-db] Enregistrement Settings "default" initialisé.');
    } else {
      console.log('✔ [setup-local-db] Enregistrement Settings "default" déjà présent.');
    }
  } catch (err) {
    console.error('❌ [setup-local-db] Erreur lors de l\'initialisation des Settings:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

await ensureDefaultSettings();
console.log('🎉 [setup-local-db] Base locale SQLite prête.');
