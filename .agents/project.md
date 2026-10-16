# Veyl — fiche projet
> Faits uniquement, maintenus par l'agent (≤ 40 lignes). Les règles sont dans ~/.codex/AGENTS.md.

## Produit
- But : veille techno et stratégique (IA, marché IT Luxembourg, Tech & Hardware) : agrégation RSS, synthèses quotidiennes et approfondissements à la demande via Google Gemini.
- Utilisateur : moi seul, sans authentification (ouverture directe sur le tableau de bord) · Plateformes : PWA mobile + desktop.

## Stack
- Expo SDK 57 (RN Web, React 19, TS strict) · `StyleSheet` + `expo-linear-gradient` + `react-native-svg`.
- Schéma : `prisma/schema.prisma` (PostgreSQL en prod Vercel/Supabase). Local : SQLite `prisma/dev.db` via `prisma/schema.local.prisma` + `scripts/setup-local-db.mjs` (ignorés par Git).
- API : local `scripts/local-server.mjs` (port 3001, routes `/api/*`) ; prod fonctions Vercel `api/*.ts` + crons `vercel.json`.
- Modules serveur uniquement (`src/server/`, `src/lib/`, `api/`) : `@prisma/client`, `rss-parser`, `@google/genai` — jamais importés par l'UI.
- Validation : `src/utils/validation.ts` (zod). Dates : `date-fns` locale `fr`.

## Commandes
| Action | Commande |
|---|---|
| Installer | `npm install` (lance `prisma generate`) |
| Base locale | `npm run setup:db` |
| Dev | `npm run web` (8081, API locale 3001) |
| Typecheck / Lint | `npm run typecheck` / `npm run lint` |
| Tests (unit + intégration) / E2E | `npm test` (`test:unit` existe, sélectionné par le harness) / `npm run test:e2e` |
| Build | `npm run build` (`expo export -p web --clear`) |
| Port de preview QA | 4173 (build `dist/` + `/api/*`) |

## Modèle de données
| Entité | Champs clés | Repository |
|---|---|---|
| Digest | id, category (IA \| Luxembourg \| Tech), title, content, createdAt | `src/storage/digestRepository.ts` |
| Source | id, name, url, category, isActive | `src/storage/sourceRepository.ts` |
| Settings | id `default`, geminiPromptIA/Lux/Tech, cronEnabled | `src/storage/settingsRepository.ts` |
- Appels IA : `src/services/aiService.ts` → API.

## Design
- Tokens `src/theme/colors.ts` · Indigo `#4F46E5` / Violet `#7C3AED` · modes clair et sombre · `testID` kebab-case sur les éléments interactifs.

## Zones sensibles et déploiement
- Déploiement Vercel (fonctions + crons). Clé Gemini et base Postgres côté serveur uniquement.
