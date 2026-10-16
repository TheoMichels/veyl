# Plan d'implémentation — veyl-lot1-socle

## Besoin reformulé et périmètre
Aligner le socle technique de Veyl avec les exigences du manuscrit commun (`stack-target.md` C1, C10, C11, C12) et l'architecture NovaBudget.
Inclus : scripts npm normés, dépendances socle (`serve`, `expo-constants`, `@react-native-async-storage/async-storage`), `app.config.js` avec `storageMode`, script standard `scripts/deploy-db.mjs`, suppression propre du faux mode local SQLite (scripts et fichiers `dev.db`), mise à jour des tests et de `.agents/project.md`, harnais strict vert.
Exclus : refonte des tokens/design (Lot 2), repositories complets AsyncStorage/Supabase (Lots 3 et 5).

## Challenge et décisions
| Fait vérifié / hypothèse | Recommandation et conséquence | Décision |
|---|---|---|
| Scripts npm non conformes (`lint` = `eslint .`, manque `preview`, `db:deploy`, `db:studio`) | Aligner exactement sur §1 de `stack-target.md` | Validé |
| SQLite local (`setup-local-db.mjs`, `local-server.mjs`, `prisma/schema.local.prisma`) proscrit | Supprimer ces fichiers, adapter les tests existants pour ne plus dépendre de SQLite | Validé |
| `app.config.js` absent (actuellement `app.json`) | Créer `app.config.js` injectant `extra.storageMode` conformément au §4 | Validé |
| `scripts/deploy-db.mjs` absent | Ajouter le script standard basé sur Prisma migrate deploy | Validé |

## Critères d'acceptation — source de vérité
| AC | Préconditions | Action | Résultat observable / mesure | Vérification |
|---|---|---|---|---|
| AC-01 | Branche `refactor/veyl-lot1-socle` | Vérifier `package.json` | Scripts `web`, `build`, `preview`, `typecheck`, `lint` (`expo lint`), `test`, `test:e2e`, `postinstall`, `db:deploy`, `db:studio` présents | Inspection `package.json` |
| AC-02 | `package.json` | Vérifier dépendances | `serve` (dev), `expo-constants`, `@react-native-async-storage/async-storage` installés | `npm list` / `package.json` |
| AC-03 | Racine projet | Vérifier `app.config.js` | Fichier présent, exportant la config Expo avec `extra.storageMode` dynamique (§4) | Inspection `app.config.js` |
| AC-04 | Racine projet | Vérifier `scripts/deploy-db.mjs` | Script présent, exécutable avec `node scripts/deploy-db.mjs` | Inspection `scripts/deploy-db.mjs` |
| AC-05 | Codebase | Nettoyage SQLite | Fichiers `scripts/setup-local-db.mjs`, `scripts/local-server.mjs`, `scripts/dev-web.mjs`, `scripts/test-db-local.mjs`, `prisma/schema.local.prisma`, `prisma/dev.db` supprimés | `ls` / `git status` |
| AC-06 | Codebase | Lancer le harnais | `bash /Users/theomichels/.gemini/config/skills/autonomous-qa/scripts/verify-harness.sh --strict` réussit (code 0) | Exécution harness |
| AC-07 | `.agents/project.md` | Mise à jour de la fiche | Commandes normées, aucune mention de SQLite, ≤ 40 lignes | Inspection `project.md` |

## Mode d'équipe et périmètres
Séquentiel — fullstack-builder réalise l'implémentation de Lot 1 puis qa-inspector valide.

| Sous-agent | AC concernés | Mission | Fichiers autorisés | Workspace |
|---|---|---|---|---|
| fullstack-builder | AC-01 à AC-07 | Implémenter L1 socle & scripts normés, passer le harnais, rédiger build-report.md | `package.json`, `package-lock.json`, `app.config.js`, `scripts/*`, `tests/*`, `e2e/*`, `prisma/*`, `.agents/project.md`, `.agents/handoff/veyl-lot1-socle/*` | inherit |
