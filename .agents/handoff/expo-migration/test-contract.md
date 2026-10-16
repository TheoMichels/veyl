# Test Contract — expo-migration

## Commandes
- Unitaires & Intégration : `node --test tests/*.test.mjs` (via `npm test` / `npm run test:unit`)
- E2E : `npx playwright test` (via `npm run test:e2e`)
- Harness : `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/verify-harness.sh --strict`

## Outillage installé / configuré lors de cette tâche
- `playwright.config.ts` (configuré sur `http://localhost:4173` avec `webServer` exécutant `node scripts/setup-local-db.mjs && node scripts/local-server.mjs --port 4173 --static dist`)
- Runner natif `node:test` (`tests/expo-stack.test.mjs` et `tests/validation-and-db.test.mjs`)
- Suite Playwright E2E (`e2e/veyl.spec.ts`) avec garde d'erreurs console automatique (`page.on('console')` + `page.on('pageerror')`)

## Matrice de couverture des Critères d'Acceptation (AC-01 à AC-08)
| AC | Critère d'acceptation | Tests Unitaires / Intégration | Tests E2E Playwright |
|---|---|---|---|
| **AC-01** | Stack Expo SDK (`expo`, `react-native-web`, sans `next`), `app.json` (`metro`, `fr`), scripts unifiés (`web`, `dev`, `build` -> `dist/`) | `U1`, `U2` (`tests/expo-stack.test.mjs`) | Couvert par le démarrage du build `dist/` dans `webServer` (`E1`–`E3`) |
| **AC-02** | Design System Expo Indigo/Violet (`src/theme/colors.ts`), bascule Clair/Sombre (`theme-toggle-btn`) et responsive desktop (`1440x900`) vs mobile (`375x812`, `mobile-history-trigger`) | `U4` (`tests/expo-stack.test.mjs`) | `E1` (`e2e/veyl.spec.ts` — Parcours 1) |
| **AC-03** | Consultation des synthèses par catégorie (`tab-ia`, `tab-lux`, `tab-tech`) et par date depuis `prisma/dev.db`, ou état vide en français, sans erreur console | `U5` (`tests/validation-and-db.test.mjs`) | `E1` (`e2e/veyl.spec.ts` — Parcours 1) |
| **AC-04** | Approfondissement IA « Aller plus loin » (`go-further-btn-0` -> `POST /api/go-further` -> ouverture et fermeture de `expanded-details-card` via `expanded-details-close-btn`) | `U7` (`tests/validation-and-db.test.mjs`) | `E2` (`e2e/veyl.spec.ts` — Parcours 2) |
| **AC-05** | Génération quotidienne de la veille (`generate-digest-btn` -> `/api/cron/ia`, `/api/cron/luxembourg`, `/api/cron/tech`) | `U7` (`tests/validation-and-db.test.mjs`) | `E2` (`e2e/veyl.spec.ts` — Parcours 2) |
| **AC-06** | Modification des prompts Gemini (`prompt-ia-input`, `save-settings-btn`) et CRUD Sources RSS (`add-source-btn`, `toggle-source-<id>`, `delete-source-<id>`) persistés dans `prisma/dev.db` après `page.reload()` | `U5`, `U7` (`tests/validation-and-db.test.mjs`) | `E3` (`e2e/veyl.spec.ts` — Parcours 3) |
| **AC-07** | Validation `zod` (`src/utils/validation.ts`) rejetant les entrées invalides (nom vide, URL non-HTTP(S), catégorie invalide, `text` vide) avec HTTP `400` côté API et `error-banner` en français côté UI | `U6`, `U7` (`tests/validation-and-db.test.mjs`) | `E3` (`e2e/veyl.spec.ts` — Parcours 3) |
| **AC-08** | Compatibilité Vercel & Prisma PostgreSQL (`prisma/schema.prisma` avec `postgresql` + `directUrl`, `.gitignore` ignorant `dev.db`/`schema.local.prisma`/`dist`/`.agents/state/`, `vercel.json` avec `outputDirectory: "dist"` et les 3 crons) | `U3` (`tests/expo-stack.test.mjs`) | — (vérifié statiquement par `U3`) |

## Cas unitaires & d'intégration
| # | Fichier | Cas | Type (nominal / limite) |
|---|---|---|---|
| U1 | `tests/expo-stack.test.mjs` | `AC-01` : Vérifie les dépendances Expo (`expo`, `react-native`, `react-native-web`, `expo-linear-gradient`, `react-native-svg`, `zod`), l'absence de `next` et la présence des scripts (`web`, `dev`, `typecheck`, `lint`, `test`, `test:unit`, `test:e2e`, `build`) | nominal |
| U2 | `tests/expo-stack.test.mjs` | `AC-01` : Vérifie que `app.json` configure `expo.web.bundler = "metro"` et `expo.web.lang = "fr"` | nominal |
| U3 | `tests/expo-stack.test.mjs` | `AC-08` : Vérifie `prisma/schema.prisma` (`postgresql` + `directUrl`), `.gitignore` (`dev.db`, `schema.local.prisma`, `.agents/state/`, `dist/`) et `vercel.json` (`outputDirectory: "dist"` + 3 crons) | nominal |
| U4 | `tests/expo-stack.test.mjs` | `AC-02` : Vérifie `getThemeColors('light' \| 'dark')` et `getThemeGradient('light' \| 'dark')` avec la palette Indigo/Violet dans `src/theme/colors.ts` | nominal |
| U5 | `tests/validation-and-db.test.mjs` | `AC-03` & `AC-06` : Lecture/écriture directe dans `prisma/dev.db` pour `Settings`, `Source` et `Digest` | nominal |
| U6 | `tests/validation-and-db.test.mjs` | `AC-07` : Validation `zod` dans `src/utils/validation.ts` (acceptation d'une source valide ; rejet nom vide, URL non-HTTP(S), catégorie invalide et `text` vide sur `go-further`) | nominal + limite |
| U7 | `tests/validation-and-db.test.mjs` | `AC-04`, `AC-05`, `AC-06`, `AC-07` : Serveur API local (`scripts/local-server.mjs`) — rejet HTTP `400` sur payloads invalides (`/api/sources`, `/api/go-further`) et persistance CRUD `/api/sources` & `/api/settings` | nominal + limite |

## Parcours E2E
| # | Fichier | Parcours | Inclut un reload ? | Viewport |
|---|---|---|---|---|
| E1 | `e2e/veyl.spec.ts` | **Parcours 1 (`AC-02`, `AC-03`)** : Ouverture sur `http://localhost:4173`, vérification du titre « Veyl », bascule Clair/Sombre (`theme-toggle-btn`), navigation `tab-ia` / `tab-lux` / `tab-tech`, vérification synthèse ou `empty-state`, puis bascule mobile (`375x812`) et ouverture de `mobile-history-trigger` | non | desktop (`1440x900`) + mobile (`375x812`) |
| E2 | `e2e/veyl.spec.ts` | **Parcours 2 (`AC-04`, `AC-05`)** : Vérification de `generate-digest-btn`, clic sur `go-further-btn-0`, apparition de `expanded-details-card`, fermeture via `expanded-details-close-btn` | non | desktop (`1440x900`) |
| E3 | `e2e/veyl.spec.ts` | **Parcours 3 (`AC-06`, `AC-07`)** : Navigation `nav-settings-btn`, test négatif URL invalide -> `error-banner`, modification `prompt-ia-input` + `save-settings-btn`, ajout source valide (`source-name-input`, `source-url-input`, `add-source-btn`), bascule `toggle-source-<id>`, `page.reload()`, vérification persistance après rechargement, puis suppression `delete-source-<id>` | **oui** | desktop (`1440x900`) |

## État attendu avant implémentation
Rouge sur `U1`–`U3`, `U6`–`U7` et `E1`–`E3` pour la raison « fonctionnalité absente / migration Expo non encore appliquée par `fullstack-builder` » (`package.json` encore sous Next.js, `app.json`, `src/utils/validation.ts` et `scripts/local-server.mjs` non encore créés). `U4` (`src/theme/colors.ts`) et `U5` (CRUD Prisma SQLite local) passent déjà.

## Ce que les tests ne couvrent pas
- L'exécution réelle des Crons planifiés par l'infrastructure Vercel en production sur la base PostgreSQL Supabase distante (hors périmètre local).
- La qualité rédactionnelle intrinsèque du modèle externe Google Gemini (les tests vérifient le contrat d'interface, le passage des prompts et la gestion déterministe de la réponse ou du fallback).
