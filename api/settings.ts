import { PrismaClient } from '@prisma/client';
import { updateSettingsSchema } from '../src/utils/validation';
import type { VercelRequest, VercelResponse } from './digests';
import { getRequestUserId } from './_auth';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const userId = getRequestUserId(req);

    if (req.method === 'GET') {
      let settings = await prisma.settings.findUnique({ where: { userId } });
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            userId,
            geminiPromptIA:
              'Tu es un expert en intelligence artificielle. Résume les actualités et nouveautés IA marquantes avec des puces claires et concises.',
            geminiPromptLux:
              'Tu es un veilleur marché IT au Luxembourg. Résume les opportunités, entreprises, et dynamiques du secteur IT luxembourgeois.',
            geminiPromptTech:
              'Tu es un journaliste tech. Résume les nouveautés matérielles (hardware) et logicielles (software). Structure avec des puces et ajoute les liens sources.',
            cronEnabled: true,
          },
        });
      }
      res.status(200).json({ settings, ...settings, id: settings.userId });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Paramètres invalides.' });
        return;
      }

      const updated = await prisma.settings.upsert({
        where: { userId },
        update: {
          geminiPromptIA: parsed.data.geminiPromptIA,
          geminiPromptLux: parsed.data.geminiPromptLux,
          geminiPromptTech: parsed.data.geminiPromptTech,
          ...(typeof parsed.data.cronEnabled === 'boolean'
            ? { cronEnabled: parsed.data.cronEnabled }
            : {}),
        },
        create: {
          userId,
          geminiPromptIA: parsed.data.geminiPromptIA,
          geminiPromptLux: parsed.data.geminiPromptLux,
          geminiPromptTech: parsed.data.geminiPromptTech,
          cronEnabled: parsed.data.cronEnabled ?? true,
        },
      });
      res.status(200).json({ settings: updated, ...updated, id: updated.userId });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur serveur sur les paramètres.',
    });
  }
}
