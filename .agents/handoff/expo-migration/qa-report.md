# QA Report — expo-migration

VERDICT: PASS

- **Date** : 2026-10-16 09:41
- **Cycle d'auto-guérison** : 2/5
- **Commit inspecté** : `a481126` (branche `feature/expo-migration`)
- **Mode d'inspection** : Script Playwright d'inspection réelle en navigateur (`.agents/state/qa-inspect.mjs` sur `http://localhost:4173`) + inspection visuelle des captures

## 1. Harness strict
| Étape | Statut | Détail |
|---|---|---|
| typecheck | PASS | `npm run typecheck` (`tsc --noEmit`) — 0 erreur |
| lint | PASS | `npm run lint` (`eslint .`) — 0 erreur |
| unit | PASS | `npm run test:unit` (`node --test tests/*.test.mjs`) — 7/7 tests PASS |
| build | PASS | `npm run build` (`EXPO_NO_TELEMETRY=1 npx expo export -p web --clear`) — export statique `dist/` généré |
| e2e | PASS | `npm run test:e2e` (`npx playwright test`) — 3/3 parcours E2E PASS |

## 2. Matrice de vérification des Critères d'Acceptation (AC-01 à AC-08)
| AC | Préconditions & Action | Résultat | Preuve concrète |
|---|---|---|---|
| **AC-01** (Stack Expo & Scripts unifiés) | Branche `feature/expo-migration` ; inspection de `package.json`, `app.json` et exécution de `npm run build`. | **PASS** | Tests unitaires `U1` et `U2` (`tests/expo-stack.test.mjs`) PASS ; `package.json` contient `expo`, `react-native-web`, `expo-linear-gradient`, `react-native-svg`, `zod` sans dépendance `next` ; scripts `web`, `dev`, `build` opérationnels ; bundle statique exporté dans `dist/`. |
| **AC-02** (Design System Expo, Thème Clair/Sombre & Responsive) | Ouverture sur desktop (`1440x900`) et mobile (`375x812`) ; clic sur `testID="theme-toggle-btn"` et `testID="mobile-history-trigger"` ; contrôle d'absence de débordement horizontal (`scrollWidth <= innerWidth`). | **PASS** | Bascule Clair/Sombre (`screenshots/desktop-dashboard-light.png`, `screenshots/desktop-dashboard-dark.png`) conforme aux tokens `src/theme/colors.ts` (palette Indigo `#4F46E5` / Violet `#7C3AED`). Sur desktop (`1440x900`), historique en panneau latéral (`scrollWidth = 1440 <= 1440`). Sur mobile (`375x812`), accordéon `mobile-history-trigger` ouvert sans débordement (`scrollWidth = 375 <= innerWidth = 375`, `nav-settings-btn` à `right = 363px <= 375px`, voir `screenshots/mobile-dashboard.png`). |
| **AC-03** (Consultation des synthèses par catégorie et par date) | Synthèses présentes dans `prisma/dev.db` ; bascule entre `testID="tab-ia"`, `testID="tab-lux"` et `testID="tab-tech"` et sélection d'une date dans l'historique. | **PASS** | Test `U5` (`tests/validation-and-db.test.mjs`), test E2E `Parcours 1` et inspection navigateur sur `http://localhost:4173` : affichage du titre, de la date relative en français (`Généré il y a 1 minute`) et des sections/puces sans erreur console (`screenshots/desktop-dashboard-light.png`). |
| **AC-04** (Approfondissement IA « Aller plus loin ») | Synthèse affichée ; clic sur `testID="go-further-btn-0"` puis fermeture via `testID="expanded-details-close-btn"`. | **PASS** | Appel `POST /api/go-further -> 200`, ouverture de `testID="expanded-details-card"` avec synthèse structurée en français sans balises Markdown brutes (`screenshots/desktop-expanded-ai.png`) et fermeture via `expanded-details-close-btn` vérifiée. |
| **AC-05** (Génération de la veille du jour) | Vue principale ; clic sur `testID="generate-digest-btn"`. | **PASS** | Passage du bouton à l'état de génération, appels `/api/cron/ia`, `/api/cron/luxembourg`, `/api/cron/tech` réussis et rafraîchissement des synthèses vérifié en E2E (`Parcours 2`) et en live. |
| **AC-06** (Paramètres & Sources RSS persistés dans SQLite après rechargement) | Navigation via `testID="nav-settings-btn"`, édition de `prompt-ia-input` + clic `save-settings-btn`, ajout d'une source via `source-name-input`/`source-url-input`/`add-source-btn`, bascule `toggle-source-<id>`, `page.reload()`, puis `delete-source-<id>`. | **PASS** | Après `page.reload()`, le marqueur sauvegardé dans `prompt-ia-input` et la source créée/basculée sont restitués depuis `prisma/dev.db` (`screenshots/desktop-settings.png`), puis la suppression retire bien la source et restaure l'état initial. |
| **AC-07** (Validation Zod & Cas négatifs) | Soumission d'entrées invalides (nom vide, URL malformée, catégorie invalide, texte vide) côté UI et API (`/api/sources`, `/api/go-further`). | **PASS** | Tests `U6` et `U7` (`tests/validation-and-db.test.mjs`) PASS ; en navigateur, la saisie de `invalid-url-without-protocol` renvoie HTTP `400` et affiche `testID="error-banner"` avec le message en français `"URL du flux RSS invalide."`. |
| **AC-08** (Compatibilité Vercel & Prisma PostgreSQL) | Inspection de `prisma/schema.prisma`, `.gitignore` et `vercel.json`. | **PASS** | Test `U3` (`tests/expo-stack.test.mjs`) PASS : `provider = "postgresql"` et `directUrl = env("DIRECT_URL")` préservés dans `prisma/schema.prisma`, `prisma/dev.db` et `prisma/schema.local.prisma` ignorés par `.gitignore`, `outputDirectory: "dist"` et les 3 crons présents dans `vercel.json`. |

## 3. Parcours (depuis ui-spec.md)
| Parcours | Résultat | Remarque |
|---|---|---|
| 1. Consultation des synthèses par catégorie et par date (AC-02, AC-03) | ✅ | Navigation fluide entre `tab-ia`, `tab-lux`, `tab-tech` et sélection par date sur desktop (`1440x900`) et mobile (`375x812`). |
| 2. Approfondissement IA « Aller plus loin » (AC-04) | ✅ | Ouverture et fermeture de `expanded-details-card` via `go-further-btn-0` et `expanded-details-close-btn` avec formatage propre. |
| 3. Génération quotidienne de la veille (AC-05) | ✅ | `generate-digest-btn` déclenche la génération sur les 3 catégories sans erreur. |
| 4. Gestion des Paramètres Gemini & Sources RSS (AC-06, AC-07) | ✅ | Validation `zod` (`error-banner`) et persistance SQLite vérifiées après `page.reload()`. |
| 5. Bascule de thème Clair / Sombre (AC-02) | ✅ | Bascule instantanée des couleurs et du fond `LinearGradient` via `theme-toggle-btn`. |

## 4. Contrôles transverses
- Persistance après rechargement : ✅ (`prompt-ia-input` et sources RSS conservés dans `prisma/dev.db` après `page.reload()`)
- État vide / erreur / chargement : ✅ (`empty-state`, `error-banner` en français, états de chargement vérifiés)
- Console (erreurs rouges) : `0`
- Réseau (4xx/5xx inattendus) : `0` (seul le `400` provoqué volontairement pour le test négatif `AC-07` a été émis)
- Responsive 375 px : ✅ (`scrollWidth = 375 <= innerWidth = 375`, `nav-settings-btn` à `right = 363px`) · 1440 px : ✅ (`scrollWidth = 1440 <= innerWidth = 1440`)

## 5. Défauts
| # | Gravité | Parcours | Reproduction | Attendu | Observé | Capture |
|---|---|---|---|---|---|---|
| — | Aucun défaut ouvert | — | Les défauts `D1` (débordement mobile dans `Header.tsx`) et `D2` (astérisques simples dans l'approfondissement IA) identifiés au Cycle 1 ont été corrigés et vérifiés au Cycle 2. | `scrollWidth <= 375` sur mobile et rendu sans balises Markdown brutes | `scrollWidth = 375` (`nav-settings-btn` `right = 363px`) et texte d'approfondissement propre | `screenshots/mobile-dashboard.png`, `screenshots/desktop-expanded-ai.png` |

## 6. Diagnostic pour le builder (si FAIL)
- Cause probable : N/A (`VERDICT: PASS`)
- Fichiers suspects : N/A

## 7. Captures
- `screenshots/desktop-dashboard-light.png`
- `screenshots/desktop-dashboard-dark.png`
- `screenshots/desktop-expanded-ai.png`
- `screenshots/desktop-settings.png`
- `screenshots/mobile-dashboard.png`
