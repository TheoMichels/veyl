# Veyl — Fiche d'identité & Règles du projet

> Ce fichier surcharge ou précise la configuration globale (`/Users/theomichels/.codex/AGENTS.md`) uniquement pour ce projet. Il ne peut pas supprimer la Phase 3 (vérification par `qa-inspector` + preuve finale).

## 1. CONTEXTE MÉTIER DE L'APPLICATION
- **Nom du projet** : Veyl
- **Objectif principal** : Application personnelle de veille technologique et stratégique (Intelligence Artificielle, Marché IT Luxembourg, Tech & Hardware) agrégeant des flux RSS et générant des synthèses quotidiennes ainsi que des approfondissements à la demande via Google Gemini.
- **Utilisateurs & Usage** : Usage personnel sur Mobile et Desktop (PWA via Expo React Native Web).

## 2. MODE D'ÉQUIPE PAR DÉFAUT
- **Mode** : Séquentiel (`ui-ux-designer` → `test-architect` → `fullstack-builder` → `qa-inspector`) pour les nouvelles fonctionnalités et refontes d'écrans ; Parallèle pour les sprints de fonctionnalités indépendantes ; Fast-track (`fullstack-builder` → `qa-inspector`) pour les bugs et petites modifications (≤ 3 fichiers, sans nouvel écran ni changement de schéma).

## 3. STACK & ARCHITECTURE LOCALE
- **Framework** : Expo SDK 57 (React Native Web, React 19, TypeScript strict, `expo export -p web`)
- **UI / Design** : React Native `StyleSheet` + `expo-linear-gradient` + `react-native-svg` + tokens centralisés dans `src/theme/colors.ts` (Palette Indigo `#4F46E5` / Violet `#7C3AED`, supportant les modes Clair et Sombre)
- **Persistance des données** :
  - **Source de vérité du schéma** : `prisma/schema.prisma` (PostgreSQL pour la production Vercel/Supabase)
  - **Stockage local de développement** : SQLite local (`prisma/dev.db`, généré automatiquement via `scripts/setup-local-db.mjs` et `prisma/schema.local.prisma`, ignorés par Git)
  - **Accès côté client** : exclusivement via les repositories (`src/storage/digestRepository.ts`, `src/storage/sourceRepository.ts`, `src/storage/settingsRepository.ts`) et services (`src/services/aiService.ts`) qui communiquent avec l'API (`/api/*`)
- **Backend / API** :
  - En local : `scripts/local-server.mjs` sert les routes `/api/*` connectées à `prisma/dev.db`, `rss-parser` et `@google/genai`.
  - Sur Vercel : fonctions Serverless `api/*.ts` + Crons définis dans `vercel.json`.
- **Validation** : `zod` (`src/utils/validation.ts`) pour toutes les entrées utilisateur et requêtes API.
- **Ports locaux** :
  - Développement web Expo : `http://localhost:8081` (avec serveur API local sur `http://localhost:3001`)
  - Preview QA & Tests E2E : `http://localhost:4173` (build statique `dist/` + routes `/api/*`)

## 4. COMMANDES CONCRÈTES DU HARNESS (OBLIGATOIRES POUR LES AGENTS)
| Action | Commande |
|---|---|
| Installer | `npm install` (exécute `prisma generate`) |
| Démarrer le serveur dev web | `npm run web` (ou alias `npm run dev`) |
| Préparer la base SQLite locale | `npm run setup:db` (`node scripts/setup-local-db.mjs`) |
| Vérifier le typage | `npm run typecheck` (`npx tsc --noEmit`) |
| Linter | `npm run lint` (`npx eslint .`) |
| Lancer les tests unitaires & intégration | `npm test` (et `npm run test:unit`) |
| Construire le build web statique | `npm run build` (`EXPO_NO_TELEMETRY=1 npx expo export -p web --clear`) |
| Lancer les tests E2E | `npm run test:e2e` (`npx playwright test`) |
| Commande globale du Harness | `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/verify-harness.sh --strict` |
| Démarrer la preview QA | `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/start-preview.sh` → `http://localhost:4173` |

## 5. MODÈLE DE DONNÉES
| Entité | Champs clés | Stockage | Repository |
|---|---|---|---|
| `Digest` | `id`, `category` (`IA` \| `Luxembourg` \| `Tech`), `title`, `content`, `createdAt` | Prisma (`Digest`) | `src/storage/digestRepository.ts` |
| `Source` | `id`, `name`, `url`, `category`, `isActive` | Prisma (`Source`) | `src/storage/sourceRepository.ts` |
| `Settings` | `id` (`default`), `geminiPromptIA`, `geminiPromptLux`, `geminiPromptTech`, `cronEnabled` | Prisma (`Settings`) | `src/storage/settingsRepository.ts` |

## 6. RÈGLES SPÉCIFIQUES AU PROJET
- Toutes les dates et durées relatives sont affichées en français (`date-fns` avec locale `fr`).
- Aucune authentification requise : l'application s'ouvre directement sur le tableau de bord de veille.
- L'UI n'importe jamais `@prisma/client`, `rss-parser` ou `@google/genai` directement : ces modules vivent uniquement côté serveur (`src/server/`, `src/lib/`, `api/`).
- Tous les éléments interactifs et conteneurs principaux exposent un `testID` stable en kebab-case.

## 7. CADRAGE ET CRITÈRES D’ACCEPTATION
- Avant toute fonctionnalité ou correction, y compris en fast-track, l’orchestrateur suit le skill `/Users/theomichels/.agents/skills/cadrage-besoins/SKILL.md` : reformuler le besoin, challenger les hypothèses et poser les questions qui changent la solution, avec une recommandation. Aucun quota minimum de questions ; respecter les décisions et autorisations déjà reçues.
- Consigner les critères métier observables `AC-01`, `AC-02`… dans `.agents/handoff/<slug>/implementation_plan.md`, avec préconditions, action et résultat attendu. Pour un bug : reproduction, observé, attendu et non-régression ; signaler une reproduction non obtenue.
- Relier chaque AC aux tests unitaires, d’intégration ou E2E pertinents, ou à un contrôle manuel justifié. Vérifier que les intégrations retenues sont exécutées par le script réellement sélectionné à l’étape `unit` du harness (`test:unit` en priorité, sinon `test`).
- Le builder ne redéfinit pas les AC silencieusement. Le QA indépendant vérifie chaque critère et fournit son résultat et sa preuve dans `qa-report.md`, repris dans la preuve finale. Un AC absent, échoué ou non vérifié interdit `VERDICT: PASS`, même si le harness est vert.
- Le fast-track allège le cadrage et les livrables, sans supprimer cette traçabilité : besoin → critères → tests/contrôles → preuves QA.
