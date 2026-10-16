# Veyl — fiche projet
> Faits uniquement, maintenus par l'agent (≤ 40 lignes). Les règles sont dans ~/.codex/AGENTS.md.

## Produit
- But : veille techno et stratégique (IA, marché IT Luxembourg, Tech & Hardware) : agrégation RSS, synthèses quotidiennes et approfondissements via Google Gemini.
- Utilisateur : moi seul, sans authentification · Plateformes : PWA web (export statique) + mobile Expo.

## Stack
- Expo SDK 57 (RN Web, React 19, TS strict) · `StyleSheet` + `expo-linear-gradient` + `react-native-svg`.
- Stockage : `app.config.js` injecte `storageMode` (`local` via AsyncStorage / `supabase` en cloud Vercel).
- Schéma : `prisma/schema.prisma` (PostgreSQL Supabase). Déploiement : `scripts/deploy-db.mjs`.
- Validation : `src/utils/validation.ts` (zod). Dates : `date-fns` locale `fr`.
- Serveur prod : Vercel Functions (`api/*.ts`) + crons `vercel.json`.

## Commandes
| Action | Commande |
|---|---|
| Dev | `npm run web` (`expo start --web --port 8081`) |
| Build / Preview | `npm run build` (`expo export -p web --clear`) / `npm run preview` (`serve dist --listen 4173`) |
| Typecheck / Lint | `npm run typecheck` (`tsc --noEmit`) / `npm run lint` (`expo lint`) |
| Tests / E2E | `npm test` (`node --test tests/*.test.mjs`) / `npm run test:e2e` (`playwright test`) |
| Base de données | `npm run db:deploy` (`node scripts/deploy-db.mjs`) / `npm run db:studio` (`prisma studio`) |

## Modèle de données
| Entité | Champs clés | Repository |
|---|---|---|
| Digest | id, category (IA \| Luxembourg \| Tech), title, content, createdAt | `src/storage/digestRepository.ts` |
| Source | id, name, url, category, isActive | `src/storage/sourceRepository.ts` |
| Settings | id `default`, geminiPromptIA/Lux/Tech, cronEnabled | `src/storage/settingsRepository.ts` |
- Appels IA : `src/services/aiService.ts` → API.

## Design
- Tokens `src/theme/colors.ts` · Indigo `#4F46E5` / Violet `#7C3AED` · modes clair et sombre · `testID` kebab-case.

## Zones sensibles et déploiement
- Déploiement Vercel (fonctions + crons). Clé Gemini et base Postgres côté serveur uniquement.
