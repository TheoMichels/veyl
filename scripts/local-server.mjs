import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { z } from 'zod';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = new PrismaClient();
const rssParser = new Parser({ timeout: 4000 });

// --- Arguments CLI ---
const args = process.argv.slice(2);
let port = Number(process.env.PORT) || 3001;
let staticDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = Number(args[i + 1]);
    i++;
  } else if (args[i] === '--static' && args[i + 1]) {
    staticDir = path.resolve(process.cwd(), args[i + 1]);
    i++;
  }
}

// --- Schémas de validation Zod ---
const digestCategorySchema = z.enum(['IA', 'Luxembourg', 'Tech'], {
  message: 'La catégorie doit être IA, Luxembourg ou Tech.',
});

const createSourceSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la source est requis.'),
  url: z
    .string()
    .trim()
    .url('URL du flux RSS invalide.')
    .refine((val) => /^https?:\/\/.+/i.test(val), {
      message: "L'URL du flux RSS doit commencer par http:// ou https://.",
    }),
  category: digestCategorySchema,
});

const toggleSourceSchema = z.object({
  id: z.string().trim().min(1, 'Identifiant de la source requis.'),
  isActive: z.boolean(),
});

const deleteSourceSchema = z.object({
  id: z.string().trim().min(1, 'Identifiant de la source requis.'),
});

const updateSettingsSchema = z.object({
  geminiPromptIA: z.string().trim().min(1, 'Le prompt IA ne peut pas être vide.'),
  geminiPromptLux: z.string().trim().min(1, 'Le prompt Luxembourg ne peut pas être vide.'),
  geminiPromptTech: z.string().trim().min(1, 'Le prompt Tech ne peut pas être vide.'),
  cronEnabled: z.boolean().optional(),
});

const goFurtherSchema = z.object({
  text: z.string().trim().min(1, "Le texte de l'actualité à approfondir est requis."),
});

const createDigestSchema = z.object({
  category: digestCategorySchema,
  title: z.string().trim().min(1, 'Le titre de la synthèse est requis.'),
  content: z.string().trim().min(1, 'Le contenu de la synthèse est requis.'),
});

// --- Helpers HTTP ---
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw || raw.trim() === '') {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function groupDigestsByDay(allDigests) {
  const byDate = {};
  for (const digest of allDigests) {
    const createdDate = new Date(digest.createdAt);
    const dateStr = format(createdDate, 'yyyy-MM-dd');
    if (!byDate[dateStr]) {
      byDate[dateStr] = {
        dateStr,
        displayDate: format(createdDate, 'd MMMM yyyy', { locale: fr }),
        iaDigest: null,
        luxDigest: null,
        techDigest: null,
      };
    }
    const serialized = {
      id: digest.id,
      category: digest.category,
      title: digest.title,
      content: digest.content,
      createdAt: createdDate.toISOString(),
    };
    if (digest.category === 'IA' && !byDate[dateStr].iaDigest) {
      byDate[dateStr].iaDigest = serialized;
    } else if (digest.category === 'Luxembourg' && !byDate[dateStr].luxDigest) {
      byDate[dateStr].luxDigest = serialized;
    } else if (digest.category === 'Tech' && !byDate[dateStr].techDigest) {
      byDate[dateStr].techDigest = serialized;
    }
  }
  return Object.values(byDate);
}

async function ensureDefaultSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'default',
        geminiPromptIA:
          'Tu es un expert en intelligence artificielle. Résume les actualités et nouveautés IA marquantes avec des puces claires et concises.',
        geminiPromptLux:
          'Tu es un veilleur marché IT au Luxembourg. Résume les opportunités, entreprises, et dynamiques du secteur IT luxembourgeois.',
        geminiPromptTech:
          'Tu es un journaliste tech. Résume les nouveautés matérielles (hardware) et logicielles (software). Structure avec des puces et ajoute les liens sources.',
        cronEnabled: true,
      },
    });
  }
  return settings;
}

function buildFallbackResearch(newsText) {
  const cleanText = newsText.replace(/\s+/g, ' ').trim();
  const excerpt = cleanText.length > 180 ? `${cleanText.slice(0, 180)}...` : cleanText;
  return `### Contexte & Implications\n\nCet élément de veille (« ${excerpt} ») s'inscrit dans une dynamique d'accélération technologique et stratégique.\n\n* **Impact opérationnel** : Adoption accrue d'architectures modulaires et d'outils d'automatisation à forte valeur ajoutée.\n* **À surveiller** : Les prochaines annonces des acteurs du secteur et les retours d'expérience en production.`;
}

async function generateResearchContent(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return buildFallbackResearch(text);
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Voici une actualité extraite d'une veille technologique :\n\n${text}\n\nDéveloppe cette actualité en apportant du contexte supplémentaire, des détails clés ou des implications concrètes (1 à 2 courts paragraphes ou points clés en Markdown).`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    if (response.text) {
      return response.text;
    }
  } catch (err) {
    console.warn('[local-server] Fallback Gemini go-further:', err instanceof Error ? err.message : String(err));
  }
  return buildFallbackResearch(text);
}

async function generateDigestForCategory(category) {
  const settings = await ensureDefaultSettings();
  const sources = await prisma.source.findMany({
    where: { category, isActive: true },
  });

  const now = new Date();
  let combinedArticles = '';

  for (const source of sources.slice(0, 5)) {
    try {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 Veyl/1.0' },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const xml = await res.text();
        const feed = await rssParser.parseString(xml);
        for (const item of (feed.items || []).slice(0, 5)) {
          combinedArticles += `\n---\nSource: ${source.name}\nTitre: ${item.title || 'Actualité'}\nLien: ${item.link || source.url}\nContenu: ${item.contentSnippet || item.summary || ''}\n---\n`;
        }
      }
    } catch {
      // Ignorer les flux injoignables en local
    }
  }

  let prompt = settings.geminiPromptIA;
  if (category === 'Luxembourg') prompt = settings.geminiPromptLux;
  if (category === 'Tech') prompt = settings.geminiPromptTech;

  let content = '';
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '' && combinedArticles.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${prompt}\n\nVoici les articles bruts :\n${combinedArticles.substring(0, 50000)}`,
      });
      if (response.text) {
        content = response.text;
      }
    } catch {
      // Fallback ci-dessous
    }
  }

  if (!content) {
    if (category === 'IA') {
      content = `## Modèles & Agents IA\n* **Avancées des modèles de raisonnement** : Les architectures hybrides combinent génération rapide et vérification étape par étape pour fiabiliser les agents autonomes.\n* **Déploiement local & sobriété** : Les modèles compacts optimisés permettent une inférence locale performante sur poste de travail.`;
    } else if (category === 'Luxembourg') {
      content = `## Écosystème IT & Cloud au Luxembourg\n* **Souveraineté numérique & finance** : Les acteurs financiers et institutionnels luxembourgeois renforcent leurs investissements dans le cloud souverain et la conformité DORA.\n* **Recrutement Tech & IA** : Forte demande pour les profils d'architectes données, DevSecOps et ingénieurs IA.`;
    } else {
      content = `## Innovations Hardware & Software\n* **Puces basse consommation & NPU** : Les nouvelles générations de processeurs intègrent des accélérateurs neuronaux dédiés aux charges IA locales.\n* **Outillage développeur multiplateforme** : Convergence accrue entre applications web et mobiles via React Native Web et Expo.`;
    }
  }

  let title = `Veille IA du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
  if (category === 'Luxembourg') {
    title = `Veille Luxembourg - Semaine du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
  } else if (category === 'Tech') {
    title = `Actualité Tech du ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
  }

  const created = await prisma.digest.create({
    data: {
      category,
      title,
      content,
    },
  });

  return created;
}

// --- Routeur principal ---
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://localhost:${port}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. /api/digests
    if (pathname === '/api/digests') {
      if (req.method === 'GET') {
        const allDigests = await prisma.digest.findMany({
          orderBy: { createdAt: 'desc' },
        });
        const groupedDigests = groupDigestsByDay(allDigests);
        sendJson(res, 200, { groupedDigests, digests: allDigests });
        return;
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const parsed = createDigestSchema.safeParse(body);
        if (!parsed.success) {
          const firstIssue = parsed.error.issues[0];
          sendJson(res, 400, { error: firstIssue?.message || 'Données de synthèse invalides.' });
          return;
        }
        const created = await prisma.digest.create({
          data: parsed.data,
        });
        sendJson(res, 201, { id: created.id, digest: created });
        return;
      }
    }

    // 2. /api/sources
    if (pathname === '/api/sources') {
      if (req.method === 'GET') {
        const sources = await prisma.source.findMany({
          orderBy: { id: 'asc' },
        });
        sendJson(res, 200, { sources });
        return;
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const parsed = createSourceSchema.safeParse(body);
        if (!parsed.success) {
          const firstIssue = parsed.error.issues[0];
          sendJson(res, 400, { error: firstIssue?.message || 'Données de source invalides.' });
          return;
        }

        const existing = await prisma.source.findUnique({
          where: { url: parsed.data.url },
        });
        if (existing) {
          await prisma.source.delete({ where: { id: existing.id } });
        }

        const source = await prisma.source.create({
          data: {
            name: parsed.data.name,
            url: parsed.data.url,
            category: parsed.data.category,
            isActive: true,
          },
        });
        sendJson(res, 201, { id: source.id, source });
        return;
      }

      if (req.method === 'PATCH') {
        const body = await readJsonBody(req);
        const parsed = toggleSourceSchema.safeParse(body);
        if (!parsed.success) {
          const firstIssue = parsed.error.issues[0];
          sendJson(res, 400, { error: firstIssue?.message || 'Paramètres de mise à jour invalides.' });
          return;
        }

        const updated = await prisma.source.update({
          where: { id: parsed.data.id },
          data: { isActive: parsed.data.isActive },
        });
        sendJson(res, 200, { id: updated.id, source: updated });
        return;
      }

      if (req.method === 'DELETE') {
        const queryId = parsedUrl.searchParams.get('id');
        const body = await readJsonBody(req).catch(() => ({}));
        const rawId = queryId || body.id || '';
        const parsed = deleteSourceSchema.safeParse({ id: rawId });
        if (!parsed.success) {
          const firstIssue = parsed.error.issues[0];
          sendJson(res, 400, { error: firstIssue?.message || 'Identifiant de source manquant.' });
          return;
        }

        await prisma.source.delete({
          where: { id: parsed.data.id },
        });
        sendJson(res, 200, { success: true, id: parsed.data.id });
        return;
      }
    }

    // 3. /api/settings
    if (pathname === '/api/settings') {
      if (req.method === 'GET') {
        const settings = await ensureDefaultSettings();
        sendJson(res, 200, { settings, ...settings });
        return;
      }

      if (req.method === 'PUT' || req.method === 'POST') {
        const body = await readJsonBody(req);
        const parsed = updateSettingsSchema.safeParse(body);
        if (!parsed.success) {
          const firstIssue = parsed.error.issues[0];
          sendJson(res, 400, { error: firstIssue?.message || 'Paramètres Gemini invalides.' });
          return;
        }

        await ensureDefaultSettings();
        const updated = await prisma.settings.update({
          where: { id: 'default' },
          data: {
            geminiPromptIA: parsed.data.geminiPromptIA,
            geminiPromptLux: parsed.data.geminiPromptLux,
            geminiPromptTech: parsed.data.geminiPromptTech,
            ...(typeof parsed.data.cronEnabled === 'boolean'
              ? { cronEnabled: parsed.data.cronEnabled }
              : {}),
          },
        });
        sendJson(res, 200, { settings: updated, ...updated });
        return;
      }
    }

    // 4. /api/go-further
    if (pathname === '/api/go-further' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const parsed = goFurtherSchema.safeParse(body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        sendJson(res, 400, { error: firstIssue?.message || 'Texte manquant pour la recherche.' });
        return;
      }

      const content = await generateResearchContent(parsed.data.text);
      sendJson(res, 200, { content });
      return;
    }

    // 5. /api/cron/:category
    if (pathname.startsWith('/api/cron/')) {
      const slug = pathname.replace('/api/cron/', '').toLowerCase();
      const categoryMap = {
        ia: 'IA',
        luxembourg: 'Luxembourg',
        tech: 'Tech',
      };
      const category = categoryMap[slug];
      if (!category) {
        sendJson(res, 400, { error: 'Catégorie de cron invalide.' });
        return;
      }

      const digest = await generateDigestForCategory(category);
      sendJson(res, 200, { message: 'Success', digestsCreated: 1, digest });
      return;
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: `Route API introuvable : ${pathname}` });
      return;
    }

    // 6. Fichiers statiques (dist/)
    if (staticDir && fs.existsSync(staticDir)) {
      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      let filePath = path.join(staticDir, relativePath);

      if (!filePath.startsWith(staticDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(staticDir, 'index.html');
      }

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    sendJson(res, 404, { error: 'Not Found' });
  } catch (error) {
    console.error('[local-server] Erreur:', error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Erreur interne du serveur local.',
    });
  }
});

server.listen(port, () => {
  console.log(`🚀 [local-server] Serveur API & Statique prêt sur http://localhost:${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
