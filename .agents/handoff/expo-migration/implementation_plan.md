# Plan d'implémentation — expo-migration

## 1. Objectif
Migrer l'application **Veyl** de Next.js vers la stack **Expo SDK (React Native Web, TypeScript strict)** sur la branche dédiée `feature/expo-migration`, afin d'uniformiser l'écosystème d'applications personnelles (mobile & desktop PWA, `npm run web`, `StyleSheet`, `LinearGradient`, tokens `src/theme/colors.ts`, repositories `src/storage/*Repository.ts`), tout en conservant la persistance SQLite locale (`prisma/dev.db`) en développement et PostgreSQL + Crons sur Vercel.

## 2. Décisions de cadrage
| Question | Réponse retenue |
|---|---|
| Stack cible & lancement | Expo SDK (`expo`, `react-native-web`, `expo-linear-gradient`, `react-native-svg`) avec `npm run web` (et alias `npm run dev`) et export statique `dist/` via `expo export -p web`. |
| Persistance & API serveur | Architecture hybride Expo + API Node/Vercel : l'UI React Native passe uniquement par des repositories (`src/storage/*Repository.ts`) qui appellent `/api/*` (servi en local par un serveur Node relié à `prisma/dev.db` et en production par les fonctions Serverless Vercel reliées à PostgreSQL). |
| Direction visuelle | Architecture Expo (`StyleSheet` + `LinearGradient` + `src/theme/colors.ts`) conservant la palette identitaire Indigo/Violet de Veyl et le bouton de bascule Clair / Sombre, responsive mobile (`< 768px`) et desktop (`>= 768px`). |
| Branche de travail | Branche dédiée `feature/expo-migration` créée depuis `feature/local-db-storage` pour conserver `scripts/setup-local-db.mjs` et `prisma/dev.db`. |

## 3. Mode d'équipe
**Séquentiel** (`ui-ux-designer` → `test-architect` → `fullstack-builder` → `qa-inspector`) — Refonte complète de la couche UI vers React Native Web, création des repositories et de la couche API compatible Expo/Vercel, et mise en place des tests unitaires/intégration et E2E Playwright.

## 4. Architecture
- **Données (entités, champs, source de vérité)** :
  - Source de vérité du schéma : `prisma/schema.prisma` (PostgreSQL pour Vercel) et `prisma/schema.local.prisma` dérivé automatiquement vers `prisma/dev.db` (SQLite local).
  - Modèles : `Digest` (`id`, `category`, `title`, `content`, `createdAt`), `Source` (`id`, `name`, `url`, `category`, `isActive`), `Settings` (`id`, `geminiPromptIA`, `geminiPromptLux`, `geminiPromptTech`, `cronEnabled`).
  - Types partagés dans `src/types/veyl.ts` + schémas de validation `zod` dans `src/utils/validation.ts`.
- **Repositories / hooks / services** :
  - `src/storage/digestRepository.ts` : récupération des synthèses groupées par jour et déclenchement de la génération quotidienne.
  - `src/storage/sourceRepository.ts` : liste, ajout, bascule actif/pause et suppression d'une source RSS.
  - `src/storage/settingsRepository.ts` : lecture et mise à jour des prompts Gemini (`IA`, `Luxembourg`, `Tech`).
  - `src/services/aiService.ts` : appel d'approfondissement IA (`/api/go-further`).
  - Backend API (`src/server/apiHandler.ts` + fonctions Vercel `api/*.ts` + serveur local `scripts/local-server.mjs`) : expose `/api/digests`, `/api/sources`, `/api/settings`, `/api/go-further`, `/api/cron/[category]`.
- **Écrans et composants React Native** :
  - `App.tsx` : racine de l'application Expo (gestion du thème Clair/Sombre, navigation entre la vue `Veille` et la vue `Paramètres`, `LinearGradient`).
  - `src/components/Header.tsx` : barre supérieure avec logo radar SVG, titre Veyl, bascule de thème (`testID="theme-toggle-btn"`), bouton de navigation Veille/Paramètres (`testID="nav-settings-btn"` / `testID="nav-home-btn"`).
  - `src/components/DigestDashboard.tsx` : vue principale avec barre latérale d'historique (repliable sur desktop, accordéon sur mobile `< 768px`), bouton « Générer la veille du jour » (`testID="generate-digest-btn"`), sélecteur d'onglets (`testID="tab-ia"`, `testID="tab-lux"`, `testID="tab-tech"`), et affichage de la synthèse.
  - `src/components/ExpandableNewsSection.tsx` : rendu structuré du Markdown de veille avec boutons d'approfondissement IA (`testID="go-further-btn-<idx>"`) et carte « Approfondissement IA » (`testID="expanded-details-card"`).
  - `src/components/SettingsView.tsx` : formulaire d'édition des 3 prompts Gemini (`testID="prompt-ia-input"`, `testID="prompt-lux-input"`, `testID="prompt-tech-input"`, `testID="save-settings-btn"`) et gestionnaire des sources RSS (`testID="source-name-input"`, `testID="source-url-input"`, `testID="source-category-select"`, `testID="add-source-btn"`, `testID="toggle-source-<id>"`, `testID="delete-source-<id>"`).

## 5. UI
- **Parcours 1 (Consultation & Approfondissement)** : Ouverture sur la vue Veille → sélection d'une catégorie (`IA`, `Luxembourg`, `Tech`) et d'une date d'historique → lecture des sections → clic sur l'icône étincelle « Aller plus loin » → affichage de la carte d'approfondissement IA → fermeture de la carte.
- **Parcours 2 (Paramètres & Sources RSS)** : Clic sur l'icône Paramètres dans l'en-tête → modification et sauvegarde des prompts Gemini → ajout d'une source RSS, bascule Actif/En pause, suppression → retour à la vue Veille.
- **États d'interface (4 états)** :
  - `loading` : indicateur de chargement lors du chargement initial, de la génération de veille ou de l'approfondissement IA.
  - `empty` : état vide explicite en français lorsqu'aucune synthèse n'est disponible pour la catégorie/date sélectionnée ou lorsqu'aucune source n'est enregistrée.
  - `error` : bandeau d'alerte en français avec action de réessai en cas d'erreur réseau/API ou de validation.
  - `populated` : affichage complet des synthèses par date et des sources/prompts.

## 6. Critères d'acceptation (AC)
- **AC-01 (Stack Expo & Scripts unifiés)** : Étant donné la branche `feature/expo-migration`, quand on inspecte `package.json`, `app.json` et qu'on exécute `npm run build`, alors l'application repose sur Expo SDK (React Native Web, sans dépendance runtime à Next.js), expose `npm run web` (et `npm run dev`) et génère le bundle statique web dans `dist/`.
- **AC-02 (Design System Expo, Thème Clair/Sombre & Responsive)** : Étant donné l'application ouverte sur desktop (`1440x900`) ou mobile (`375x812`), quand l'utilisateur clique sur `testID="theme-toggle-btn"`, alors le thème bascule entre Clair et Sombre selon les tokens `src/theme/colors.ts` (palette Indigo/Violet), et l'historique s'affiche en panneau latéral sur desktop ou en accordéon repliable sur mobile (`< 768px`).
- **AC-03 (Consultation des synthèses par catégorie et par date)** : Étant donné des synthèses présentes dans `prisma/dev.db`, quand l'utilisateur bascule entre les onglets `testID="tab-ia"`, `testID="tab-lux"` et `testID="tab-tech"` ou choisit une date dans l'historique, alors la synthèse correspondante (titre, date relative en français, sections et puces) ou l'état vide de la catégorie s'affiche sans erreur console.
- **AC-04 (Approfondissement IA « Aller plus loin »)** : Étant donné une synthèse affichée avec des points d'actualité, quand l'utilisateur clique sur un bouton `testID="go-further-btn-0"`, alors l'application interroge `POST /api/go-further`, affiche la carte `testID="expanded-details-card"` (avec la synthèse approfondie ou un message d'erreur maîtrisé en français si la clé Gemini est absente/invalide) et permet de la refermer.
- **AC-05 (Génération de la veille du jour)** : Étant donné la vue principale, quand l'utilisateur clique sur `testID="generate-digest-btn"`, alors le bouton affiche l'état de génération en cours, appelle `/api/cron/ia`, `/api/cron/luxembourg` et `/api/cron/tech`, et met à jour les synthèses (ou affiche une alerte en français si un flux/clé échoue).
- **AC-06 (Paramètres & Sources RSS persistés dans SQLite après rechargement)** : Étant donné la vue Paramètres (`testID="nav-settings-btn"`), quand l'utilisateur modifie un prompt Gemini et sauvegarde (`testID="save-settings-btn"`), ajoute une source RSS valide (`testID="add-source-btn"`), bascule son statut Actif/En pause, recharge la page (`page.reload()`), puis supprime la source, alors chaque modification est persistée dans `prisma/dev.db` et restituée après rechargement.
- **AC-07 (Validation Zod & Cas négatifs)** : Étant donné le formulaire d'ajout de source ou les routes API (`/api/sources`, `/api/settings`, `/api/go-further`), quand une entrée invalide est soumise (URL invalide, nom vide, texte manquant), alors `zod` rejette la donnée avec un statut HTTP `400` côté API et un message d'erreur en français côté UI.
- **AC-08 (Compatibilité Vercel & Prisma PostgreSQL)** : Étant donné `prisma/schema.prisma`, `vercel.json` et le dossier `api/`, quand on vérifie la configuration de déploiement, alors `prisma/schema.prisma` conserve `provider = "postgresql"`, `prisma/dev.db` et `prisma/schema.local.prisma` sont ignorés par Git, et `vercel.json` configure `dist` ainsi que les 3 crons quotidiens/hebdomadaires.

## 7. Contrat de tests & vérification
| AC | Niveau | Vérification |
|---|---|---|
| AC-01 | Unitaire + Build | Test vérifiant `package.json` (scripts `web`, `dev`, `build`, dépendances Expo) + étape `build` du harness (`expo export -p web`). |
| AC-02 | E2E Playwright | Vérification du switch Clair/Sombre (`theme-toggle-btn`) et du comportement responsive desktop (`1440x900`) vs mobile (`375x812`). |
| AC-03 | Intégration + E2E | Test d'intégration API/SQLite sur les synthèses + parcours E2E de changement d'onglets (`tab-ia`, `tab-lux`, `tab-tech`) et de date. |
| AC-04 | Intégration + E2E | Test de l'endpoint `/api/go-further` + clic E2E sur `go-further-btn-0` et ouverture/fermeture de `expanded-details-card`. |
| AC-05 | Intégration + E2E | Test de l'endpoint `/api/cron/[category]` + clic E2E sur `generate-digest-btn`. |
| AC-06 | Intégration + E2E | Test CRUD SQLite (`Settings`, `Source`) + parcours E2E complet dans Paramètres avec `page.reload()` vérifiant la persistance SQLite. |
| AC-07 | Unitaire + Intégration | Tests unitaires des schémas `zod` (cas valides et invalides) + test API renvoyant HTTP 400 sur entrée malformée. |
| AC-08 | Unitaire | Vérification de `prisma/schema.prisma` (`postgresql`), `.gitignore` (`dev.db`, `schema.local.prisma`) et `vercel.json` (crons + `dist`). |

## 8. Découpage & périmètres
| Sous-agent | Mission | Fichiers autorisés | Workspace |
|---|---|---|---|
| `ui-ux-designer` | Spécifier le design system Expo Indigo/Violet (Clair/Sombre), les 4 états d'interface, les `testID` et créer les tokens `src/theme/colors.ts` + squelettes dans `.agents/handoff/expo-migration/ui-spec.md`. | `.agents/handoff/expo-migration/ui-spec.md`, `src/theme/colors.ts`, `src/types/veyl.ts` | inherit |
| `test-architect` | Configurer l'outillage de test et Playwright sur le port `4173`, écrire `test-contract.md`, les tests unitaires/intégration (`tests/*.test.mjs`) et les tests E2E (`e2e/*.spec.ts`). | `.agents/handoff/expo-migration/test-contract.md`, `tests/**`, `e2e/**`, `playwright.config.ts`, `package.json` | inherit |
| `fullstack-builder` | Migrer le projet vers Expo SDK, implémenter le serveur API local + routes Vercel `api/*`, les repositories `src/storage/*`, les composants React Native (`App.tsx`, `src/components/*`), et faire passer `verify-harness.sh --strict` au vert. | `App.tsx`, `index.ts`, `app.json`, `tsconfig.json`, `eslint.config.js`, `package.json`, `vercel.json`, `api/**`, `src/**`, `scripts/**`, `public/**`, `assets/**`, `.gitignore`, `.agents/handoff/expo-migration/build-report.md` | inherit |
| `qa-inspector` | Exécuter le harness strict, lancer la preview sur `4173`, inspecter les parcours dans un navigateur réel (desktop & mobile, persistance après reload, zéro erreur console) et rédiger `qa-report.md`. | `.agents/handoff/expo-migration/qa-report.md`, `.agents/handoff/expo-migration/screenshots/**` | inherit |

## 9. Risques & hors périmètre
- **Risque** : Coexistence d'anciens fichiers Next.js (`src/app/`, `next.config.ts`) qui perturberaient la détection du type de projet (`detect()` dans `start-preview.sh` vérifie `d.next ? "nextjs" : d.expo ? "expo"`). → **Mitigation** : Supprimer proprement `next` des dépendances et retirer les fichiers spécifiques à Next.js (`next.config.ts`, `next-env.d.ts`, `src/app/`) lors de la migration Expo.
- **Risque** : Appels Gemini en test E2E sans clé API active ou réseau lent. → **Mitigation** : Le serveur API gère proprement l'absence ou l'erreur de clé API et permet un mode déterministe/fallback propre si `GEMINI_API_KEY` est absente en environnement de test CI, tout en utilisant le vrai SDK `@google/genai` dès que la clé est présente.
- **Hors périmètre** : Déploiement en production sur Vercel ou modification de la base Supabase distante (tout se fait sur `feature/expo-migration` en local).
