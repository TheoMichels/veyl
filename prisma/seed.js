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
    // --- Catégorie : IA ---
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'IA' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml', category: 'IA' },
    { name: 'MarkTechPost (AI Research)', url: 'https://www.marktechpost.com/feed/', category: 'IA' },
    { name: 'Hacker News (AI)', url: 'https://hnrss.org/newest?q=AI', category: 'IA' },
    
    // --- Catégorie : Tech ---
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech' },
    { name: 'The Verge Tech', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Tech' },
    { name: 'Hacker News (Frontpage)', url: 'https://hnrss.org/frontpage', category: 'Tech' },

    // --- Catégorie : Luxembourg ---
    { name: 'L\'essentiel (Économie)', url: 'https://partner-feeds.lessentiel.lu/rss/lessentiel-fr/economie', category: 'Luxembourg' },
    { name: 'CSSF (Régulation)', url: 'https://www.cssf.lu/fr/feed/', category: 'Luxembourg' },
    { name: 'RTL Today', url: 'https://today.rtl.lu/rss/feed/headlines.rss', category: 'Luxembourg' }
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
