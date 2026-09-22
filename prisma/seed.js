const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      geminiPromptIA: `Tu es un expert en veille technologique spécialisé en Intelligence Artificielle.
Je vais te fournir une liste d'articles publiés dans les dernières 24h.
Fais-moi une synthèse globale (format Markdown) des 3 à 5 points les plus importants à retenir.
Structure ta réponse avec des titres clairs, des puces (bullet points) et ajoute les liens vers les sources à la fin.
Ne fais pas de blabla introductif.`,
      geminiPromptLux: `Tu es un expert en veille stratégique et économique spécialisé sur le marché luxembourgeois (IT, finance, réglementation).
Je vais te fournir une liste d'articles parus récemment.
Fais-moi une synthèse globale (format Markdown) des 3 à 5 faits marquants.
Concentre-toi sur l'impact business, réglementaire (DORA, etc.) et IT.
Structure ta réponse avec des titres clairs, des puces (bullet points) et ajoute les liens vers les sources à la fin.`,
      cronEnabled: true,
    },
  })

  const sources = [
    { name: 'Hacker News (AI)', url: 'https://hnrss.org/newest?q=AI', category: 'IA' },
    { name: 'Paperjam Tech', url: 'https://paperjam.lu/rss/tech', category: 'Luxembourg' },
    { name: 'Silicon Luxembourg', url: 'https://www.siliconluxembourg.lu/feed/', category: 'Luxembourg' }
  ]

  for (const s of sources) {
    await prisma.source.upsert({
      where: { url: s.url },
      update: {},
      create: s,
    })
  }

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
