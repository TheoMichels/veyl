import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchFeed } from '@/lib/rss';
import { analyzeGlobalFeed } from '@/lib/gemini';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

const categoryMap: Record<string, string> = {
  'ia': 'IA',
  'luxembourg': 'Luxembourg',
  'tech': 'Tech'
};

export async function GET(request: Request, { params }: { params: Promise<{ category: string }> | { category: string } }) {
  try {
    // Handle both Next.js 14 (params is object) and Next.js 15 (params is Promise)
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.category;
    const category = categoryMap[slug.toLowerCase()];

    if (!category) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!settings || !settings.cronEnabled) {
      return NextResponse.json({ message: 'Cron is disabled in settings' }, { status: 200 });
    }

    const sources = await prisma.source.findMany({ 
      where: { 
        isActive: true,
        category: category 
      } 
    });
    
    if (sources.length === 0) {
      return NextResponse.json({ message: `Aucune source pour ${category}` }, { status: 200 });
    }

    let combinedArticlesText = '';
    const now = new Date();
    const cutoffDate = new Date();
    
    if (category === 'IA' || category === 'Tech') {
      cutoffDate.setDate(now.getDate() - 2);
    } else {
      cutoffDate.setDate(now.getDate() - 8);
    }

    const feedPromises = sources.map(source => 
      fetchFeed(source.url).then(items => ({ source, items }))
    );
    const results = await Promise.allSettled(feedPromises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { source, items } = result.value;
        for (const item of items) {
          if (item.pubDate < cutoffDate) continue;
          combinedArticlesText += `\n---\nSource: ${source.name}\nTitre: ${item.title}\nLien: ${item.link}\nContenu/Résumé: ${item.content}\n---\n`;
        }
      } else {
        console.error(`Error processing feed for source:`, result.reason);
      }
    }

    if (combinedArticlesText.trim() === '') {
      return NextResponse.json({ message: `Aucun nouvel article pour ${category}` }, { status: 200 });
    }

    let prompt = settings.geminiPromptIA;
    if (category === 'Luxembourg') prompt = settings.geminiPromptLux;
    else if (category === 'Tech') prompt = (settings as any).geminiPromptTech || "Tu es un expert tech. Fais une synthèse des nouveautés matérielles et logicielles.";
    
    let digestContent;
    try {
      digestContent = await analyzeGlobalFeed(combinedArticlesText, prompt);
    } catch (err: any) {
      throw new Error(`Erreur Gemini pour ${category}: ${err.message || err.toString()}`);
    }
    
    if (!digestContent) {
      throw new Error(`Gemini n'a pas pu générer la synthèse pour ${category}. Vérifiez la clé API.`);
    }

    let title = '';
    if (category === 'IA') title = `Veille IA du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    else if (category === 'Luxembourg') title = `Veille Luxembourg - Semaine du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    else title = `Actualité Tech du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;

    await prisma.digest.create({
      data: {
        category,
        title,
        content: digestContent,
      }
    });

    return NextResponse.json({ message: 'Success', digestsCreated: 1 }, { status: 200 });
  } catch (error: any) {
    console.error(`Cron error for category:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
