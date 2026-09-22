import { PrismaClient } from '@prisma/client';
import { saveSettings, addSource, toggleSource, deleteSource } from './actions';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  const sources = await prisma.source.findMany();

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-neutral-900 dark:text-white">Paramètres de Veille</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Gérez vos sources RSS et les instructions de l'IA (Option B).</p>
      </div>

      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Prompts Gemini (Instructions)</h2>
        <form action={saveSettings} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Prompt pour la catégorie "IA"</label>
            <textarea 
              name="geminiPromptIA"
              defaultValue={settings.geminiPromptIA}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Prompt pour la catégorie "Luxembourg"</label>
            <textarea 
              name="geminiPromptLux"
              defaultValue={settings.geminiPromptLux}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">
            Sauvegarder les instructions
          </button>
        </form>
      </section>

      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Sources d'actualités (Flux RSS)</h2>
        
        <div className="space-y-4 mb-8">
          {sources.map(source => (
            <div key={source.id} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-white">{source.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400">{source.category}</span>
                </div>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 mt-1 hover:text-indigo-600 hover:underline">{source.url}</a>
              </div>
              <div className="flex items-center gap-3">
                <form action={toggleSource.bind(null, source.id, !source.isActive)}>
                  <button className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${source.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                    {source.isActive ? 'Actif' : 'En pause'}
                  </button>
                </form>
                <form action={deleteSource.bind(null, source.id)}>
                  <button className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-2 font-medium">Supprimer</button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 mt-6">
          <h3 className="text-md font-medium mb-4 text-neutral-900 dark:text-white">Ajouter une nouvelle source</h3>
          <form action={addSource} className="flex flex-col sm:flex-row gap-4">
            <input 
              required
              name="name" 
              placeholder="Nom du site" 
              className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input 
              required
              name="url" 
              placeholder="URL du flux RSS" 
              className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select name="category" className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="IA">IA</option>
              <option value="Luxembourg">Luxembourg</option>
            </select>
            <button type="submit" className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-neutral-900 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm whitespace-nowrap shadow-sm">
              Ajouter
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
