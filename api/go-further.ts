import { researchNews } from '../src/lib/gemini';
import { goFurtherSchema } from '../src/utils/validation';
import type { VercelRequest, VercelResponse } from './digests';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const parsed = goFurtherSchema.safeParse(rawBody);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Texte manquant.' });
      return;
    }

    const content = await researchNews(parsed.data.text);
    res.status(200).json({ content });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erreur lors de l'approfondissement IA.",
    });
  }
}
