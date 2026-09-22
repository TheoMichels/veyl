const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI();

async function test(model) {
  try {
    const response = await ai.models.generateContent({ model, contents: "Hello" });
    console.log(`Success for ${model}:`, response.text.substring(0, 30));
  } catch (err) {
    console.error(`Error for ${model}:`, err.message);
  }
}

async function runAll() {
  await test('gemini-3.7-flash');
  await test('gemini-3.6-flash');
  await test('gemini-3.5-flash');
  await test('gemini-2.5-flash');
}
runAll();
