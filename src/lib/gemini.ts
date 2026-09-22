import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export async function analyzeGlobalFeed(
  articlesText: string, 
  prompt: string
) {
  const fullPrompt = `${prompt}\n\nVoici les articles bruts :\n${articlesText.substring(0, 15000)}`;
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
      });
      return response.text;
    } catch (error: any) {
      console.warn(`[Avertissement] Le modèle ${modelName} a échoué: ${error.message}`);
      // Si c'est le dernier modèle testé, on throw l'erreur
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        throw error;
      }
      // Sinon, on continue la boucle pour essayer le modèle suivant
    }
  }
  return null;
}
