# Build Report — veyl-lot1-socle

- **Statut** : READY_FOR_QA
- **Cycle** : 1 (première livraison Lot 1)
- **Branche** : `refactor/veyl-lot1-socle`

## Fichiers créés / modifiés
| Fichier | Rôle | Périmètre |
|---|---|---|
| `package.json`, `package-lock.json` | Scripts normés, deps `serve`, `expo-constants`, `@react-native-async-storage/async-storage` | Oui |
| `app.config.js` | Injection dynamique de `extra.storageMode` (`local` / `supabase`) | Oui |
| `scripts/deploy-db.mjs` | Script de déploiement standard Prisma migrate deploy via `DIRECT_URL` | Oui |
| `scripts/*.mjs`, `prisma/schema.local.prisma`, `prisma/dev.db` | Suppression des fichiers obsolètes SQLite | Oui |
| `playwright.config.ts`, `e2e/veyl.spec.ts` | Alignement webServer sur `npm run preview` et interception API | Oui |
| `tests/expo-stack.test.mjs`, `tests/validation-and-db.test.mjs` | Couverture des AC socle sans dépendance SQLite | Oui |
| `.agents/project.md` | Fiche projet à jour, commandes normées, sans SQLite (36 lignes) | Oui |

## Données & Schéma
- Changement de schéma : non (PostgreSQL Supabase préservé dans `prisma/schema.prisma`).
- Aucune commande exécutée sur une base distante : confirmé.

## Harness (`verify-result.json`)
| typecheck | lint | unit | build | e2e | Statut global |
|---|---|---|---|---|---|
| PASS | PASS | PASS | PASS | PASS | PASS |

## Acceptation et preuves d’exécution
| AC | Implémentation | Contrôle / Commande | Résultat |
|---|---|---|---|
| AC-01 & AC-02 | `package.json` | `node --test tests/expo-stack.test.mjs` | 10 scripts cibles & 3 deps socle validés |
| AC-03 | `app.config.js` | `node --test tests/expo-stack.test.mjs` | `storageMode` testé local et cloud |
| AC-04 | `scripts/deploy-db.mjs` | `node --test tests/expo-stack.test.mjs` | Script présent, validation DIRECT_URL |
| AC-05 | `scripts/*`, `prisma/*` | `node --test tests/expo-stack.test.mjs` | Fichiers SQLite supprimés |
| AC-06 | Codebase | `verify-harness.sh --strict` | Code 0, 5/5 étapes vertes |
| AC-07 | `.agents/project.md` | Inspection & `wc -l` | 36 lignes, commandes exactes, zéro SQLite |
