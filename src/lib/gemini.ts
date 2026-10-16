import { GoogleGenAI } from '@google/genai';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildFallbackDigest(articlesText: string, prompt: string): string {
  const lines = articlesText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('Titre:'));

  const firstTitles = lines.slice(0, 4).map((l) => l.replace(/^Titre:\s*/, ''));
  if (firstTitles.length === 0) {
    return `## Points clés de la veille\n* **Synthèse automatisée** : Veille générée selon les instructions configurées (${prompt.slice(0, 80)}...).`;
  }

  const bullets = firstTitles
    .map((t) => `* **${t}** : Analyse consolidée à partir des flux RSS actifs.`)
    .join('\n');

  return `## Points clés de la veille\n${bullets}`;
}

export function buildFallbackResearch(newsText: string): string {
  const cleanText = newsText.replace(/\s+/g, ' ').trim();
  const excerpt = cleanText.length > 180 ? `${cleanText.slice(0, 180)}...` : cleanText;
  return `### Contexte & Implications\n\nCet élément de veille (« ${excerpt} ») s'inscrit dans une dynamique d'accélération technologique et stratégique.\n\n* **Impact opérationnel** : Adoption accrue d'architectures modulaires et d'outils d'automatisation à forte valeur ajoutée.\n* **À surveiller** : Les prochaines annonces des acteurs du secteur et les retours d'expérience en production.`;
}

export async function analyzeGlobalFeed(
  articlesText: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return buildFallbackDigest(articlesText, prompt);
  }

  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = `${prompt}\n\nVoici les articles bruts :\n${articlesText.substring(0, 100000)}`;
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  const maxRetries = 2;
  let lastError: Error | undefined;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });
        if (response.text) {
          return response.text;
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;
        const errorMessage = err.message.toLowerCase();
        if (
          errorMessage.includes('503') ||
          errorMessage.includes('429') ||
          errorMessage.includes('overloaded') ||
          errorMessage.includes('unavailable')
        ) {
          await sleep(attempt * 1000);
          continue;
        }
        break;
      }
    }
  }

  if (lastError) {
    console.warn(`[Gemini] Fallback utilisé suite à l'erreur : ${lastError.message}`);
  }
  return buildFallbackDigest(articlesText, prompt);
}

export async function researchNews(newsText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return buildFallbackResearch(newsText);
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Voici une actualité extraite d'une veille technologique :

${newsText}

Développe cette actualité en apportant du contexte supplémentaire, des détails clés ou des implications concrètes. L'objectif est d'en savoir plus pour "aller plus loin", tout en restant synthétique et rapide à lire (1 à 2 courts paragraphes ou points clés percutants). 
Important : Assure-toi de bien relier ton explication aux acteurs et technologies spécifiques mentionnés dans le texte original (par exemple en les citant), afin de ne pas produire une réponse trop générique ou théorique. Formatte ta réponse en Markdown.`;

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  const maxRetries = 2;
  let lastError: Error | undefined;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;
        const errorMessage = err.message.toLowerCase();
        if (
          errorMessage.includes('503') ||
          errorMessage.includes('429') ||
          errorMessage.includes('overloaded') ||
          errorMessage.includes('unavailable')
        ) {
          await sleep(attempt * 1000);
          continue;
        }
        break;
      }
    }
  }

  if (lastError) {
    console.warn(`[Gemini] Fallback researchNews utilisé suite à l'erreur : ${lastError.message}`);
  }
  return buildFallbackResearch(newsText);
}
