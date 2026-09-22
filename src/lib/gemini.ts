import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeGlobalFeed(
  articlesText: string, 
  prompt: string
) {
  // On augmente la limite de 15 000 à 100 000 caractères.
  // 100 000 caractères = ~25 000 tokens. 
  // Avec le modèle Pro (env. 1.25$ / 1M tokens), cela coûte ~0.03$ par appel, 
  // ce qui permet de rester parfaitement dans votre budget de 2-3€/mois tout en lisant 6x plus d'articles.
  const fullPrompt = `${prompt}\n\nVoici les articles bruts :\n${articlesText.substring(0, 100000)}`;
  // On inclut les modèles Pro en priorité pour plus de robustesse (facturation au token).
  const modelsToTry = [
    'gemini-3.1-pro-preview',
    'gemini-2.5-pro',
    'gemini-2.0-pro',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  const maxRetries = 3;
  let lastError;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });
        return response.text;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Avertissement] Le modèle ${modelName} a échoué (Tentative ${attempt}/${maxRetries}): ${error.message}`);
        
        // Si c'est une erreur de type surcharge (503) ou quota (429), on attend avec un délai exponentiel
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
          const delay = attempt * 2000; // 2s, 4s, 6s
          console.log(`Attente de ${delay}ms avant de réessayer...`);
          await sleep(delay);
          continue; // Réessayer le même modèle
        } else {
          break; // Passer au modèle suivant pour les autres types d'erreurs (ex: 400 Bad Request)
        }
      }
    }
  }
  
  throw new Error(`Tous les modèles ont échoué après plusieurs tentatives. Dernière erreur: ${lastError?.message}`);
}
