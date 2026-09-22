import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchFeed } from '@/lib/rss';
import { analyzeGlobalFeed } from '@/lib/gemini';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!settings || !settings.cronEnabled) {
      return NextResponse.json({ message: 'Cron is disabled in settings' }, { status: 200 });
    }

    const sources = await prisma.source.findMany({ where: { isActive: true } });
    let digestsCreated = 0;

    // Group sources by category
    const categories = ['IA', 'Luxembourg'];

    for (const category of categories) {
      const categorySources = sources.filter(s => s.category === category);
      if (categorySources.length === 0) continue;

      let combinedArticlesText = '';

      // Determine cutoff date (24h for IA, 7 days for Luxembourg)
      const now = new Date();
      const cutoffDate = new Date();
      if (category === 'IA') {
        cutoffDate.setDate(now.getDate() - 2); // get last 2 days just in case
      } else {
        cutoffDate.setDate(now.getDate() - 8);
      }

      for (const source of categorySources) {
        const feedItems = await fetchFeed(source.url);

        for (const item of feedItems) {
          if (item.pubDate < cutoffDate) continue;

          combinedArticlesText += `
---
Source: ${source.name}
Titre: ${item.title}
Lien: ${item.link}
Contenu/Résumé: ${item.content}
---
`;
        }
      }

      if (combinedArticlesText.trim() === '') continue; // No news

      const prompt = category === 'IA' ? settings.geminiPromptIA : settings.geminiPromptLux;

      let digestContent;
      try {
        // Call Gemini for the global synthesis
        digestContent = await analyzeGlobalFeed(combinedArticlesText, prompt);
      } catch (err: any) {
        throw new Error(`Erreur Gemini pour ${category}: ${err.message || err.toString()}`);
      }
      
      if (digestContent) {
        const title = category === 'IA'
          ? `Veille IA du ${format(now, 'dd MMMM yyyy', { locale: fr })}`
          : `Veille Luxembourg - Semaine du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;

        await prisma.digest.create({
          data: {
            category,
            title,
            content: digestContent,
          }
        });
        digestsCreated++;
      } else {
        throw new Error(`Gemini n'a pas pu générer la synthèse pour ${category}. Vérifiez la clé API.`);
      }
    }

    return NextResponse.json({ message: 'Success', digestsCreated }, { status: 200 });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
