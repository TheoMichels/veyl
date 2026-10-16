import { PrismaClient } from '@prisma/client';
import assert from 'assert';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Démarrage des tests d\'intégration Prisma SQLite local...');

  // 1. Test Settings
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  assert(settings !== null, 'Settings "default" doit exister');
  console.log('✔ Settings local accessible');

  // 2. Test CRUD Source
  const testUrl = `https://test-${Date.now()}.local/rss`;
  const createdSource = await prisma.source.create({
    data: {
      name: 'Source Test Local',
      url: testUrl,
      category: 'IA',
      isActive: true,
    },
  });
  assert.strictEqual(createdSource.url, testUrl);
  
  const fetchedSource = await prisma.source.findUnique({ where: { url: testUrl } });
  assert(fetchedSource !== null);
  
  await prisma.source.delete({ where: { id: createdSource.id } });
  console.log('✔ CRUD Source local validé');

  // 3. Test CRUD Digest
  const testDigest = await prisma.digest.create({
    data: {
      category: 'IA',
      title: 'Digest Test Local',
      content: 'Contenu test en base SQLite locale',
    },
  });
  assert(testDigest.id);
  const foundDigest = await prisma.digest.findUnique({ where: { id: testDigest.id } });
  assert.strictEqual(foundDigest.title, 'Digest Test Local');
  await prisma.digest.delete({ where: { id: testDigest.id } });
  console.log('✔ CRUD Digest local validé');

  console.log('🎉 Tous les tests locaux SQLite ont réussi avec succès !');
}

runTests()
  .catch((err) => {
    console.error('❌ Échec des tests SQLite:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
