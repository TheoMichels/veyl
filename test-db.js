const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const digests = await prisma.digest.findMany({ take: 1 });
  console.log(digests[0].content);
}
main();
