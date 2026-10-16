import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchFeed } from '../../src/lib/rss';
import { analyzeGlobalFeed } from '../../src/lib/gemini';
import type { VercelRequest, VercelResponse } from '../digests';
import { getRequestUserId } from '../_auth';

const prisma = new PrismaClient();

const categoryMap: Record<string, 'IA' | 'Luxembourg' | 'Tech'> = {
  ia: 'IA',
  luxembourg: 'Luxembourg',
  tech: 'Tech',
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const userId = getRequestUserId(req);
    const rawCat = req.query?.category;
    const slug = (Array.isArray(rawCat) ? rawCat[0] : rawCat || '').toLowerCase();
    const category = categoryMap[slug];

    if (!category) {
      res.status(400).json({ error: 'Catégorie invalide.' });
      return;
    }

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings || !settings.cronEnabled) {
      res.status(200).json({ message: 'Cron désactivé dans les paramètres.' });
      return;
    }

    const sources = await prisma.source.findMany({
      where: { userId, isActive: true, category },
    });

    if (sources.length === 0) {
      res.status(200).json({ message: `Aucune source active pour ${category}` });
      return;
    }

    const now = new Date();
    const lastDigest = await prisma.digest.findFirst({
      where: { userId, category },
      orderBy: { createdAt: 'desc' },
    });

    const cutoffDate = lastDigest ? new Date(lastDigest.createdAt) : new Date(now.getTime() - 48 * 3600 * 1000);
    let combinedArticlesText = '';

    const results = await Promise.allSettled(
      sources.map(async (source) => ({
        source,
        items: await fetchFeed(source.url),
      }))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { source, items } = result.value;
        for (const item of items) {
          if (item.pubDate < cutoffDate) continue;
          combinedArticlesText += `\n---\nSource: ${source.name}\nTitre: ${item.title}\nLien: ${item.link}\nContenu/Résumé: ${item.content}\n---\n`;
        }
      }
    }

    if (combinedArticlesText.trim() === '') {
      res.status(200).json({ message: `Aucun nouvel article pour ${category}` });
      return;
    }

    let prompt = settings.geminiPromptIA;
    if (category === 'Luxembourg') prompt = settings.geminiPromptLux;
    else if (category === 'Tech') prompt = settings.geminiPromptTech;

    const digestContent = await analyzeGlobalFeed(combinedArticlesText, prompt);

    let title = `Veille IA du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    if (category === 'Luxembourg') {
      title = `Veille Luxembourg - Semaine du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    } else if (category === 'Tech') {
      title = `Actualité Tech du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    }

    await prisma.digest.create({
      data: {
        userId,
        category,
        title,
        content: digestContent,
      },
    });

    res.status(200).json({ message: 'Success', digestsCreated: 1 });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur lors de la génération de la veille.',
    });
  }
}
