import { PrismaClient } from '@prisma/client';
import {
  createSourceSchema,
  toggleSourceSchema,
  deleteSourceSchema,
} from '../src/utils/validation';
import type { VercelRequest, VercelResponse } from './digests';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      const sources = await prisma.source.findMany({ orderBy: { id: 'asc' } });
      res.status(200).json({ sources });
      return;
    }

    if (req.method === 'POST') {
      const parsed = createSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Source invalide.' });
        return;
      }

      const existing = await prisma.source.findUnique({ where: { url: parsed.data.url } });
      if (existing) {
        await prisma.source.delete({ where: { id: existing.id } });
      }

      const source = await prisma.source.create({
        data: {
          name: parsed.data.name,
          url: parsed.data.url,
          category: parsed.data.category,
          isActive: true,
        },
      });
      res.status(201).json({ id: source.id, source });
      return;
    }

    if (req.method === 'PATCH') {
      const parsed = toggleSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Paramètres invalides.' });
        return;
      }

      const updated = await prisma.source.update({
        where: { id: parsed.data.id },
        data: { isActive: parsed.data.isActive },
      });
      res.status(200).json({ id: updated.id, source: updated });
      return;
    }

    if (req.method === 'DELETE') {
      const queryId = typeof req.query?.id === 'string' ? req.query.id : undefined;
      const bodyObj = (req.body || {}) as Record<string, unknown>;
      const rawId = queryId || (typeof bodyObj.id === 'string' ? bodyObj.id : '');
      const parsed = deleteSourceSchema.safeParse({ id: rawId });
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Identifiant manquant.' });
        return;
      }

      await prisma.source.delete({ where: { id: parsed.data.id } });
      res.status(200).json({ success: true, id: parsed.data.id });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur serveur sur les sources RSS.',
    });
  }
}
