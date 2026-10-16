# Build Report — expo-migration

- **Statut** : READY_FOR_QA
- **Cycle** : 2 (correction suite à `qa-report.md` Cycle 1/5)
- **Branche / workspace** : `feature/expo-migration` (`/Users/theomichels/App/veyl`)

## Fichiers créés / modifiés
| Fichier | Rôle | Dans le périmètre ? |
|---|---|---|
| `package.json`, `package-lock.json` | Migration des dépendances vers Expo SDK 57 (`expo`, `react-native-web`, `expo-linear-gradient`, `react-native-svg`, `zod`, `@playwright/test`), retrait de `next` et scripts unifiés (`web`, `dev`, `typecheck`, `lint`, `test`, `test:unit`, `test:e2e`, `build`) | oui |
| `app.json` | Configuration Expo Web (`bundler: "metro"`, `lang: "fr"`, thème Indigo `#4F46E5`) | oui |
| `index.ts` | Point d'entrée Expo (`registerRootComponent(App)`) | oui |
| `App.tsx` | Racine de l'application React Native Web (thème Clair/Sombre via `LinearGradient`, navigation `dashboard`/`settings`, chargement des synthèses) | oui |
| `tsconfig.json` | Configuration TypeScript stricte (`expo/tsconfig.base`, `strict: true`) | oui |
| `eslint.config.js` | Configuration ESLint flat config (`eslint-config-expo/flat`) | oui |
| `vercel.json` | Configuration Vercel (`outputDirectory: "dist"`, rewrites `/api/*` et les 3 crons quotidiens/hebdomadaires) | oui |
| `.gitignore` | Exclusion de `prisma/*.db`, `prisma/dev.db`, `prisma/schema.local.prisma`, `dist/`, `.expo/`, `.agents/state/` | oui |
| `assets/icon.png`, `assets/favicon.png` | Icônes d'application et favicon pour Expo Web | oui |
| `src/utils/validation.ts` | Schémas de validation `zod` (`createSourceSchema`, `toggleSourceSchema`, `deleteSourceSchema`, `updateSettingsSchema`, `goFurtherSchema`, `createDigestSchema`) | oui |
| `src/services/apiClient.ts` | Client HTTP avec résolution automatique de l'URL de base (`http://localhost:3001` depuis le port `8081` d'Expo dev, origine courante `""` en preview `4173` et sur Vercel) | oui |
| `src/services/aiService.ts` | Service d'approfondissement IA (`POST /api/go-further`) avec validation `zod` | oui |
| `src/storage/digestRepository.ts` | Repository des synthèses groupées par jour et déclenchement de la génération quotidienne | oui |
| `src/storage/sourceRepository.ts` | Repository CRUD des sources RSS (`GET`, `POST`, `PATCH`, `DELETE /api/sources`) | oui |
| `src/storage/settingsRepository.ts` | Repository de lecture et mise à jour des prompts Gemini (`GET`, `PUT /api/settings`) | oui |
| `src/components/Header.tsx` | Barre supérieure responsive (`useWindowDimensions` : adaptation mobile `375x812` sans débordement horizontal) avec logo Radar SVG, bascule Clair/Sombre (`theme-toggle-btn`) et navigation (`nav-home-btn`, `nav-settings-btn`) | oui |
| `src/components/DigestDashboard.tsx` | Tableau de bord principal avec historique par date (barre latérale desktop `sidebar-toggle-btn` / accordéon mobile `mobile-history-trigger`), bouton `generate-digest-btn`, onglets (`tab-ia`, `tab-lux`, `tab-tech`), état vide (`empty-state`) et bannière d'erreur (`error-banner`) | oui |
| `src/components/ExpandableNewsSection.tsx` | Découpage structuré du Markdown en sections et puces (gras `**...**`, italique `*...*` et liens) avec indexation séquentielle déterministe (`go-further-btn-0`, `go-further-btn-1`, …) et carte d'approfondissement IA (`expanded-details-card`, `expanded-details-close-btn`) | oui |
| `src/components/SettingsView.tsx` | Vue Paramètres pour l'édition des 3 prompts Gemini (`prompt-ia-input`, `prompt-lux-input`, `prompt-tech-input`, `save-settings-btn`) et le CRUD des sources RSS (`source-name-input`, `source-url-input`, `source-category-select`, `add-source-btn`, `toggle-source-<id>`, `delete-source-<id>`) | oui |
| `src/lib/gemini.ts`, `src/lib/rss.ts` | Utilitaires serveur Gemini et RSS typés strictement avec fallback déterministe propre lorsque `GEMINI_API_KEY` est absente ou indisponible | oui |
| `scripts/local-server.mjs` | Serveur HTTP local Node.js servant les routes `/api/*` sur `prisma/dev.db` (avec validation `zod`) ainsi que le bundle statique `dist/` avec fallback SPA | oui |
| `scripts/dev-web.mjs` | Script orchestrant le serveur API local (`3001`) et Expo Web (`8081`) pour `npm run web` / `npm run dev` | oui |
| `api/digests.ts`, `api/sources.ts`, `api/settings.ts`, `api/go-further.ts`, `api/cron/[category].ts` | Fonctions Serverless Vercel pour la production | oui |
| Suppression des fichiers Next.js (`next.config.ts`, `next-env.d.ts`, `.eslintrc.json`, `postcss.config.mjs`, `tailwind.config.ts`, `src/app/**`, `src/components/ClientHome.tsx`, `src/components/ExpandableNews.tsx`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`) | Nettoyage complet de l'ancienne stack Next.js et des fichiers temporaires | oui |

## Données
- Changement de schéma : non (`prisma/schema.prisma` conservé intact avec `provider = "postgresql"` et `directUrl = env("DIRECT_URL")` ; dérivation SQLite locale via `scripts/setup-local-db.mjs` vers `prisma/dev.db`).
- Aucune commande exécutée sur une base distante : confirmé.

## Harness (`verify-result.json`)
| typecheck | lint | unit | build | e2e |
|---|---|---|---|---|
| PASS | PASS | PASS | PASS | PASS |

## Défauts corrigés (si cycle de correction)
| Défaut (qa/review) | Correction |
|---|---|
| **D1 (Majeur — `AC-02` Responsive `375x812`)** : Débordement horizontal de `src/components/Header.tsx` (`scrollWidth = 424 > 375`) coupant le bouton `nav-settings-btn` sur mobile. | Ajout de `useWindowDimensions()` (`isMobile = width < 768`) dans `src/components/Header.tsx` : masquage du sous-titre `brandSubtitle` sur mobile, réduction des paddings/gaps (`headerMobile`, `iconButtonMobile`, `logoBadgeMobile`) et `flexShrink: 1` sur le bloc marque afin que `scrollWidth <= 375` et que `theme-toggle-btn` et `nav-settings-btn` restent intégralement dans le viewport `375x812`. |
| **D2 (Mineur — `AC-04` Approfondissement IA)** : Astérisques simples `*...*` visibles dans le texte de fallback d'approfondissement (`src/lib/gemini.ts` / `scripts/local-server.mjs`). | Suppression des astérisques simples autour de `${excerpt}` dans `buildFallbackResearch` (`src/lib/gemini.ts` et `scripts/local-server.mjs`) ET prise en charge du formatage italique `*...*` dans `renderFormattedInlineText` (`src/components/ExpandableNewsSection.tsx`). |

## Tests du contrat contestés (le cas échéant)
- Aucun test contesté ni modifié.

## Choix techniques & points d'attention
- **Découplage strict Client / Serveur** : Aucun composant React Native (`App.tsx`, `src/components/*`) n'importe `@prisma/client`, `rss-parser` ou `@google/genai`. Toutes les opérations passent par `src/storage/*Repository.ts` et `src/services/aiService.ts`.
- **Indexation déterministe de `go-further-btn-<idx>`** : `ExpandableNewsSection.tsx` attribue les index séquentiels (`0, 1, ...`) uniquement aux éléments actionnables rendus, garantissant que le premier bouton visible porte toujours `testID="go-further-btn-0"`.
- **Ordre déterministe des sources RSS** : `GET /api/sources` trie par `id: 'asc'` (ordre chronologique `cuid()`), garantissant que la dernière source ajoutée correspond toujours à `.last()` dans les tests E2E.
