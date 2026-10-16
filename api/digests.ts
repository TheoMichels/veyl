import type { IncomingMessage, ServerResponse } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createDigestSchema } from '../src/utils/validation';
import type { DayGroup, DigestCategory } from '../src/types/veyl';

const prisma = new PrismaClient();

export interface VercelRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      const allDigests = await prisma.digest.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const byDate: Record<string, DayGroup> = {};
      for (const digest of allDigests) {
        const createdDate = new Date(digest.createdAt);
        const dateStr = format(createdDate, 'yyyy-MM-dd');
        if (!byDate[dateStr]) {
          byDate[dateStr] = {
            dateStr,
            displayDate: format(createdDate, 'd MMMM yyyy', { locale: fr }),
            iaDigest: null,
            luxDigest: null,
            techDigest: null,
          };
        }
        const serialized = {
          id: digest.id,
          category: digest.category as DigestCategory,
          title: digest.title,
          content: digest.content,
          createdAt: createdDate.toISOString(),
        };
        if (digest.category === 'IA' && !byDate[dateStr].iaDigest) {
          byDate[dateStr].iaDigest = serialized;
        } else if (digest.category === 'Luxembourg' && !byDate[dateStr].luxDigest) {
          byDate[dateStr].luxDigest = serialized;
        } else if (digest.category === 'Tech' && !byDate[dateStr].techDigest) {
          byDate[dateStr].techDigest = serialized;
        }
      }

      res.status(200).json({ groupedDigests: Object.values(byDate), digests: allDigests });
      return;
    }

    if (req.method === 'POST') {
      const parsed = createDigestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Données invalides.' });
        return;
      }
      const created = await prisma.digest.create({ data: parsed.data });
      res.status(201).json({ id: created.id, digest: created });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur serveur lors de la lecture des synthèses.',
    });
  }
}
