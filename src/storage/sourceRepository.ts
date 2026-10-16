import {
  createSourceSchema,
  toggleSourceSchema,
  deleteSourceSchema,
  sourcesListSchema,
  type CreateSourceInput,
} from '../utils/validation';
import { readStored, writeStored } from './validatedStorage';
import type { Source } from '../types/veyl';

export const SOURCES_STORAGE_KEY = '@veyl_sources_v1';

export const DEFAULT_SOURCES: Source[] = [
  {
    id: 'src_tc_ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'IA',
    isActive: true,
  },
  {
    id: 'src_verge_ai',
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml',
    category: 'IA',
    isActive: true,
  },
  {
    id: 'src_marktechpost',
    name: 'MarkTechPost (AI Research)',
    url: 'https://www.marktechpost.com/feed/',
    category: 'IA',
    isActive: true,
  },
  {
    id: 'src_hn_ai',
    name: 'Hacker News (AI)',
    url: 'https://hnrss.org/newest?q=AI',
    category: 'IA',
    isActive: true,
  },
  {
    id: 'src_ars_tech',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'Tech',
    isActive: true,
  },
  {
    id: 'src_verge_tech',
    name: 'The Verge Tech',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'Tech',
    isActive: true,
  },
  {
    id: 'src_tc',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Tech',
    isActive: true,
  },
  {
    id: 'src_hn_front',
    name: 'Hacker News (Frontpage)',
    url: 'https://hnrss.org/frontpage',
    category: 'Tech',
    isActive: true,
  },
  {
    id: 'src_lessentiel',
    name: "L'essentiel (Économie)",
    url: 'https://partner-feeds.lessentiel.lu/rss/lessentiel-fr/economie',
    category: 'Luxembourg',
    isActive: true,
  },
  {
    id: 'src_cssf',
    name: 'CSSF (Régulation)',
    url: 'https://www.cssf.lu/fr/feed/',
    category: 'Luxembourg',
    isActive: true,
  },
  {
    id: 'src_rtl',
    name: 'RTL Today',
    url: 'https://today.rtl.lu/rss/feed/headlines.rss',
    category: 'Luxembourg',
    isActive: true,
  },
];

export async function getSources(): Promise<Source[]> {
  try {
    const stored = await readStored(SOURCES_STORAGE_KEY, sourcesListSchema, []);
    if (stored.length === 0) {
      await writeStored(SOURCES_STORAGE_KEY, sourcesListSchema, DEFAULT_SOURCES);
      return DEFAULT_SOURCES;
    }
    return stored;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Données locales')) {
      throw error;
    }
    return DEFAULT_SOURCES;
  }
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  const parsed = createSourceSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Données de source invalides.');
  }

  const current = await getSources();
  const filtered = current.filter((s) => s.url !== parsed.data.url);
  const newSource: Source = {
    id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: parsed.data.name,
    url: parsed.data.url,
    category: parsed.data.category,
    isActive: true,
  };

  const updated = [newSource, ...filtered];
  await writeStored(SOURCES_STORAGE_KEY, sourcesListSchema, updated);
  return newSource;
}

export async function toggleSourceStatus(id: string, isActive: boolean): Promise<Source> {
  const parsed = toggleSourceSchema.safeParse({ id, isActive });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Paramètres de statut invalides.');
  }

  const current = await getSources();
  const target = current.find((s) => s.id === parsed.data.id);
  if (!target) {
    throw new Error('Source introuvable.');
  }

  const updatedSource: Source = { ...target, isActive: parsed.data.isActive };
  const updatedList = current.map((s) => (s.id === parsed.data.id ? updatedSource : s));
  await writeStored(SOURCES_STORAGE_KEY, sourcesListSchema, updatedList);
  return updatedSource;
}

export async function removeSource(id: string): Promise<void> {
  const parsed = deleteSourceSchema.safeParse({ id });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Identifiant de source invalide.');
  }

  const current = await getSources();
  const updated = current.filter((s) => s.id !== parsed.data.id);
  await writeStored(SOURCES_STORAGE_KEY, sourcesListSchema, updated);
}
