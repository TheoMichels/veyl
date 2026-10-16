import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  createDigestSchema,
  digestsListSchema,
  type CreateDigestInput,
} from '../utils/validation';
import { readStored, writeStored } from './validatedStorage';
import type { DayGroup, Digest } from '../types/veyl';

export const DIGESTS_STORAGE_KEY = '@veyl_digests_v1';

const nowIso = new Date().toISOString();

export const DEFAULT_DIGESTS: Digest[] = [
  {
    id: 'dig_init_ia',
    category: 'IA',
    title: 'Synthèse IA — Agents autonomes et modèles multimodaux',
    content: `## Faits saillants
* **Essor des architectures agentiques** : Les nouveaux modèles intègrent des capacités natives de planification et de vérification par rétroaction.
* **Optimisation des contextes longs** : Réduction drastique des latences et baisse des coûts d'inférence.
* **Gouvernance et sûreté** : Évolution des benchmarks vers des métriques de fiabilité en situation réelle.`,
    createdAt: nowIso,
  },
  {
    id: 'dig_init_lux',
    category: 'Luxembourg',
    title: 'Synthèse Luxembourg — Place financière et souveraineté numérique',
    content: `## Écosystème & Régulation
* **Conformité DORA** : Les institutions renforcent la résilience de leurs prestataires informatiques.
* **Transition cloud souverain** : Nouveaux partenariats public-privé pour l'hébergement des données sensibles.
* **Attractivité IT** : Demande soutenue pour les compétences en cybersécurité et devops.`,
    createdAt: nowIso,
  },
  {
    id: 'dig_init_tech',
    category: 'Tech',
    title: 'Synthèse Tech — Hardware & Infrastructure',
    content: `## Nouveautés Matériel & Cloud
* **Efficacité énergétique des serveurs** : Déploiement accéléré des puces ARM haute densité dans les datacenters.
* **Stockage NVMe de nouvelle génération** : Débits accrus et latences divisées par deux.
* **Standards ouverts** : Consolidation des initiatives autour de RISC-V et des interfaces interconnectées.`,
    createdAt: nowIso,
  },
];

export function groupDigestsByDay(digests: Digest[]): DayGroup[] {
  const groupsMap = new Map<string, { ia: Digest | null; lux: Digest | null; tech: Digest | null; dateObj: Date }>();

  for (const digest of digests) {
    const dateObj = new Date(digest.createdAt);
    const dateStr = !isNaN(dateObj.getTime())
      ? format(dateObj, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    if (!groupsMap.has(dateStr)) {
      groupsMap.set(dateStr, { ia: null, lux: null, tech: null, dateObj });
    }
    const group = groupsMap.get(dateStr)!;
    if (digest.category === 'IA' && !group.ia) {
      group.ia = digest;
    } else if (digest.category === 'Luxembourg' && !group.lux) {
      group.lux = digest;
    } else if (digest.category === 'Tech' && !group.tech) {
      group.tech = digest;
    }
  }

  const sortedDates = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return sortedDates.map((dateStr) => {
    const group = groupsMap.get(dateStr)!;
    const isToday = dateStr === todayStr;
    const displayDate = isToday
      ? "Aujourd'hui"
      : format(group.dateObj, 'EEEE d MMMM yyyy', { locale: fr });

    return {
      dateStr,
      displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1),
      iaDigest: group.ia,
      luxDigest: group.lux,
      techDigest: group.tech,
    };
  });
}

export async function getDigests(): Promise<Digest[]> {
  try {
    const stored = await readStored(DIGESTS_STORAGE_KEY, digestsListSchema, []);
    if (stored.length === 0) {
      await writeStored(DIGESTS_STORAGE_KEY, digestsListSchema, DEFAULT_DIGESTS);
      return DEFAULT_DIGESTS;
    }
    return stored;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Données locales')) {
      throw error;
    }
    return DEFAULT_DIGESTS;
  }
}

export async function getGroupedDigests(): Promise<DayGroup[]> {
  const digests = await getDigests();
  return groupDigestsByDay(digests);
}

export async function addDigest(input: CreateDigestInput): Promise<Digest> {
  const parsed = createDigestSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Données de synthèse invalides.');
  }

  const current = await getDigests();
  const newDigest: Digest = {
    id: `dig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category: parsed.data.category,
    title: parsed.data.title,
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
  };

  const updated = [newDigest, ...current];
  await writeStored(DIGESTS_STORAGE_KEY, digestsListSchema, updated);
  return newDigest;
}

export async function triggerDailyDigestsGeneration(): Promise<void> {
  const todayIso = new Date().toISOString();
  const current = await getDigests();

  const generated: Digest[] = [
    {
      id: `dig_gen_ia_${Date.now()}`,
      category: 'IA',
      title: 'Synthèse IA générée — Actualités du jour',
      content: `## Synthèse du jour\n* **Nouvelle mise à jour des flux RSS** analysée avec succès.\n* Aucun changement critique détecté sur les modèles majeurs.`,
      createdAt: todayIso,
    },
    {
      id: `dig_gen_lux_${Date.now()}`,
      category: 'Luxembourg',
      title: 'Synthèse Luxembourg générée — Marché & Économie',
      content: `## Marché local\n* Synthèse automatique des flux économiques luxembourgeois.\n* Activité stable sur la place financière.`,
      createdAt: todayIso,
    },
    {
      id: `dig_gen_tech_${Date.now()}`,
      category: 'Tech',
      title: 'Synthèse Tech générée — Hardware & Logiciel',
      content: `## Nouveautés Tech\n* Analyse consolidée des annonces hardware du jour.`,
      createdAt: todayIso,
    },
  ];

  await writeStored(DIGESTS_STORAGE_KEY, digestsListSchema, [...generated, ...current]);
}
