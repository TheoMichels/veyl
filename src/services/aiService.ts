import { apiRequest } from './apiClient';
import { goFurtherSchema } from '../utils/validation';

interface GoFurtherResponse {
  content: string;
}

export async function fetchGoFurther(text: string): Promise<string> {
  const parsed = goFurtherSchema.safeParse({ text });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || "Le texte de l'actualité est invalide.");
  }

  const data = await apiRequest<GoFurtherResponse>('/api/go-further', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!data.content || typeof data.content !== 'string') {
    throw new Error("Aucune synthèse d'approfondissement n'a été retournée.");
  }

  return data.content;
}
