import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeGlobalFeed(
  articlesText: string,
  prompt: string
) {
  // On augmente la limite de 15 000 à 100 000 caractères.
  // 100 000 caractères = ~25 000 tokens. 
  // Avec le modèle Flash, cela coûte une fraction d'un centime par appel.
  const fullPrompt = `${prompt}\n\nVoici les articles bruts :\n${articlesText.substring(0, 100000)}`;
  // On inclut les modèles Flash en priorité pour réduire les coûts liés aux tokens.
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview'
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

export async function researchNews(newsText: string) {
  const prompt = `Voici une actualité extraite d'une veille technologique :

${newsText}

Développe cette actualité en apportant du contexte supplémentaire, des détails clés ou des implications concrètes, tout en restant relativement synthétique et rapide à lire (1 à 2 courts paragraphes ou points clés percutants). L'objectif est d'en savoir plus pour aller plus loin, sans prendre trop de temps de lecture et sans répéter ce qui est déjà écrit. Formatte ta réponse en Markdown.`;

  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview'
  ];

  const maxRetries = 3;
  let lastError;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });
        return response.text;
      } catch (error: unknown) {
        const err = error as Error;
        lastError = err;
        console.warn(`[Avertissement] Le modèle ${modelName} a échoué pour la recherche approfondie (Tentative ${attempt}/${maxRetries}): ${err.message}`);

        const errorMessage = err.message?.toLowerCase() || '';
        if (errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
          const delay = attempt * 2000;
          console.log(`Attente de ${delay}ms avant de réessayer...`);
          await sleep(delay);
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw new Error(`Tous les modèles ont échoué pour la recherche approfondie. Dernière erreur: ${lastError?.message}`);
}
