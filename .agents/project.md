# Veyl — fiche projet
> Faits uniquement, maintenus par l'agent (≤ 40 lignes). Les règles sont dans ~/.codex/AGENTS.md.

## Produit
- But : veille techno et stratégique (IA, marché IT Luxembourg, Tech & Hardware) : agrégation RSS, synthèses quotidiennes et approfondissements via Google Gemini.
- Utilisateur : moi seul · Plateformes : PWA web (export statique) + mobile Expo.

## Stack
- Expo SDK 57 (RN Web, React 19, TS strict) · `StyleSheet` + `expo-linear-gradient` + `react-native-svg`.
- Stockage : `src/config/storageMode.ts` (local AsyncStorage `@veyl_*_v1` / cloud Supabase schéma `veyl`).
- Schéma : `prisma/schema.prisma` multiSchema (`veyl`, `auth`). Déploiement : `scripts/deploy-db.mjs`.
- Auth : Supabase Auth partagée (`src/services/authService.ts`, `useAuth.ts`, `AuthScreen.tsx`, `AuthModal.tsx`).
- Validation : `src/utils/validation.ts` (zod pour entrées externes et stockage local).
- Serveur prod : Vercel Functions (`api/*.ts`) + crons `vercel.json`.

## Commandes
| Action | Commande |
|---|---|
| Dev | `npm run web` (`expo start --web --port 8081`) |
| Build / Preview | `npm run build` (`expo export -p web --clear`) / `npm run preview` (`serve dist --listen 4173`) |
| Typecheck / Lint | `npm run typecheck` (`tsc --noEmit`) / `npm run lint` (`expo lint`) |
| Tests / E2E | `npm test` (`node --test tests/*.test.mjs`) / `npm run test:e2e` (`playwright test`) |
| Base de données | `npm run db:deploy` (`node scripts/deploy-db.mjs`) / `npm run db:studio` (`prisma studio`) |

## Modèle de données (schéma veyl)
| Entité | Table / Clés | Repository |
|---|---|---|
| Digest | `veyl.digests` (id, user_id, category, title, content, created_at) | `src/storage/digestRepository.ts` |
| Source | `veyl.sources` (id, user_id, name, url, category, is_active) | `src/storage/sourceRepository.ts` |
| Settings | `veyl.user_settings` (user_id, gemini_prompt_*, cron_enabled) | `src/storage/settingsRepository.ts` |

## Design
- Tokens §2 `src/theme/colors.ts` (gradient, brand `#4F46E5`, panel glass, radius 12–24, shadows) · clair & sombre · testID kebab-case.
- DA radar gradient indigo/violet · surfaces translucides · badge Stockage local / compte cloud · onglets IA/Lux/Tech.

## Zones sensibles et déploiement
- Déploiement Vercel (fonctions + crons). Données en schéma `veyl` sur Supabase partagé. Clé Gemini serveur uniquement.
- Cron : `CRON_SECRET` requis ; `OWNER_USER_ID` facultatif (repli dans `api/_auth.ts`). Auth manuelle : couple complet `EXPO_PUBLIC_SUPABASE_*` prioritaire, sinon `SUPABASE_*` ; même projet que `DATABASE_URL`.
