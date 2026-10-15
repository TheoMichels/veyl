# Audit qualité et reproductibilité — Veyl

État inspecté le 15/10/2026 dans `/Users/theomichels/App/veyl`, branche `codex/application-profile`, HEAD `1205e3d` (09/10/2026, « fix AI button »). Audit documentaire et vérification locale du typage uniquement. Aucun code applicatif modifié, aucune installation, exécution de diagnostic réseau/base, migration, génération Prisma, compilation ou vérification navigateur.

## Résultat utilisable dans la fiche comparable

- **Typage : FAIL confirmé localement**, deux erreurs de configuration détaillées ci-dessous. TypeScript strict est configuré, mais le build autorise explicitement les erreurs TypeScript.
- **Tests unitaires/intégration/E2E : aucune suite automatisée identifiée** dans les fichiers/configurations inspectés. Les cinq fichiers `test*` à la racine sont des essais ou diagnostics sans assertions, et plusieurs appellent des services réels. Couverture non mesurée ; aucun pourcentage à annoncer.
- **Lint : configuré mais commande npm incohérente avec le CLI installé**, constat par inspection, sans exécution. `next lint` est déclaré tandis que le CLI Next installé n'enregistre pas cette commande.
- **Build et fonctionnement en production : inconnus**, volontairement non exécutés. Un éventuel build réussi ne prouverait pas la réussite du typage puisque `ignoreBuildErrors: true` est présent.
- **Reproductibilité : partielle**, lockfile npm v3 présent et toutes les versions directes installées correspondent au lockfile, mais Node/npm ne sont pas fixés par le projet, les contrôles de peer dependencies sont désactivés et une incompatibilité React/Next est confirmée par calcul semver local.
- **CI/harness projet : non identifiés** dans l'inventaire du dépôt. Un script de harness externe est référencé par AGENTS et existe sur cette machine ; son fonctionnement n'a pas été évalué.

## Versions déclarées, verrouillées et installées

`package.json:12-37` contient les déclarations. La section racine du lockfile correspond à toutes ces déclarations (`package-lock.json:7-37`). Lecture JSON locale des `node_modules/<paquet>/package.json` : les versions installées égalent les versions verrouillées pour les 23 dépendances directes. Les lignes ci-dessous désignent le début du bloc dans `package-lock.json`.

| Paquet | Déclaré | Verrouillé et installé | Ligne du lockfile |
|---|---|---|---|
| next | ^16.3.6 | 16.3.6 | 5771 |
| react / react-dom | 19.0.0-rc-66855b96-20241106 | même version RC | 6591 / 6600 |
| typescript | ^5 | 5.9.3 | 7805 |
| prisma / @prisma/client | ^5.22.0 | 5.22.0 | 6496 / 1024 |
| tailwindcss | ^3.4.1 | 3.4.19 | 7462 |
| @tailwindcss/typography | ^0.5.20 | 0.5.20 | 1172 |
| eslint | ^8 | 8.57.1 | 3143 |
| eslint-config-next | latest | 15.0.3 | 3200 |
| @types/node | ^20 | 20.19.43 | 1263 |
| @types/react / @types/react-dom | ^18 | 18.3.31 / 18.3.7 | 1279 / 1290 |
| postcss | ^8 | 8.5.28 | 6301 |
| @google/genai | ^2.24.0 | 2.24.0 | 148 |
| date-fns | ^4.4.0 | 4.4.0 | 2749 |
| lucide-react | ^1.47.0 | 1.47.0 | 5051 |
| next-themes | ^0.4.6 | 0.4.6 | 5824 |
| nextjs-toploader | ^3.9.17 | 3.9.17 | 5862 |
| react-markdown | ^10.1.0 | 10.1.0 | 6618 |
| rss-parser | ^3.13.0 | 3.13.0 | 6823 |
| clsx | ^2.1.1 | 2.1.1 | 2589 |
| tailwind-merge | ^3.7.0 | 3.7.0 | 7452 |

Points de cohérence :

- Next 16.3.6 et `eslint-config-next` 15.0.3 proviennent de générations différentes ; la déclaration `latest` ne fixe pas la version d'une future résolution sans le lockfile (`package.json:19,33`, `package-lock.json:3201,5772`). Cela ne suffit pas à démontrer un échec ESLint, qui n'a pas été lancé.
- React 19 RC coexiste avec les types React 18 (`package.json:22-23,30-31`). Ce décalage est constaté, sans conclure à un bug UI spécifique.
- Le peer React de Next installé est `^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0` (`package-lock.json:5801-5806`). `semver.satisfies` local renvoie **false** pour le React RC installé. `.npmrc:1` contient `legacy-peer-deps=true`, ce qui désactive la prise en compte normale des peer dependencies à l'installation. Aucun `npm install`/`npm ci` n'a été exécuté pour mesurer les conséquences.
- Aucun champ `engines` ni `packageManager` dans `package.json:1-39`, aucun fichier `.nvmrc`, `.node-version` ou `.tool-versions` identifié dans l'inventaire. Environnement observé : **Node v24.19.0, npm 11.17.0**. Le Next verrouillé exige Node `>=20.9.0` (`package-lock.json:5787-5788`). La version Node de l'hébergement demeure inconnue.
- `package.json:10` exécute `prisma generate` après installation. La reproductibilité d'une installation propre et de la génération n'a pas été testée.

## Commandes et contrôles

| Contrôle | Déclaration / preuve | Résultat de l'audit |
|---|---|---|
| Développement | `next dev --turbopack`, `package.json:6` | Déclaré, non lancé |
| Compilation | `next build`, `package.json:7` | Déclaré, non lancé |
| Production locale | `next start`, `package.json:8` | Déclaré, non lancé |
| Lint | `next lint`, `package.json:9` ; `.eslintrc.json:2` étend `next/core-web-vitals` et `next/typescript` | Non lancé ; le CLI installé `node_modules/next/dist/bin/next:109-240` déclare build/dev/start/typegen et autres commandes, aucune commande lint |
| Typage | Strict/noEmit dans `tsconfig.json:11-12` | **FAIL** : commande locale exécutée ci-dessous |
| Tests unitaires | AGENTS demande `npm run test` (`AGENTS.md:18`) | Script `test` absent de `package.json:5-11` ; aucune suite identifiée |
| E2E | AGENTS demande `npx playwright test` (`AGENTS.md:19`) | Playwright et sa configuration absents de l'inventaire ; pas exécuté, pour éviter installation/réseau implicites |
| Harness strict | AGENTS référence un chemin utilisateur externe (`AGENTS.md:20`) | Existence du script confirmée par `test -f`, pas d'exécution ni de configuration locale `.agents/harness.config` identifiée |

La commande autorisée réellement exécutée :

```text
./node_modules/.bin/tsc --noEmit --incremental false
exit code: 2
next.config.ts(4,3): error TS2353: Object literal may only specify known properties, and 'eslint' does not exist in type 'NextConfig'.
prisma.config.ts(1,36): error TS2307: Cannot find module 'prisma/config' or its corresponding type declarations.
```

`--incremental false` évite l'écriture du cache incrémental. Le `tsconfig.json:31-36` inclut les TS/TSX et types Next déjà présents ; aucun `next typegen` n'a été effectué. Le résultat couvre donc l'état du workspace et des dépendances installées, sans certifier la génération des routes sur un checkout neuf. `skipLibCheck: true` (`tsconfig.json:10`) omet la vérification complète des déclarations des bibliothèques. Les fichiers de diagnostic JS racine ne font pas partie des motifs `include` TS/TSX.

`next.config.ts:4-14` conserve une configuration héritée de contournement ESLint et `typescript.ignoreBuildErrors: true`. La première est rejetée par les types Next installés ; la seconde déclare que la compilation peut continuer malgré des erreurs de typage. Ce sont des constats de source, pas un build observé.

## Nature des fichiers appelés « test »

| Fichier | Comportement lu | Classement |
|---|---|---|
| `test.js:1-2` | Deux imports CommonJS, dont un fichier TypeScript ; commentaire signalant la difficulté d'import | Ébauche sans assertions |
| `test-db.js:1-7` | Instancie Prisma, lit un digest, affiche son contenu | Diagnostic contre base réelle, sans assertion |
| `test-models.js:1-19` | Appelle `GoogleGenAI.models.generateContent` sur quatre modèles et affiche succès/erreur | Diagnostic API externe, potentiellement payant, sans assertion |
| `test-rss.js:1-15` | Deux `fetch` de flux RSS publics et affichage des statuts | Diagnostic réseau, sans assertion |
| `test_markdown.js:1-30` | Rend ReactMarkdown côté serveur et affiche le texte extrait | Essai local de rendu, sans résultat attendu vérifié |

Aucun de ces fichiers n'a été exécuté. Aucun runner Vitest, Jest, jest-expo, Playwright, `@playwright/test` ou `@testing-library/react` trouvé dans les dépendances verrouillées ou installées, par lecture JSON. L'inventaire `rg --files --hidden` hors `.git`, `node_modules`, `.next`, secrets et skills n'a identifié aucun autre fichier de tests, config de runner, workflow CI (`.github`, `.gitlab`, `.circleci`) ou harness projet. Cette absence est limitée au dépôt inspecté ; des contrôles externes non versionnés peuvent exister.

## Écart avec les documents locaux

- `AGENTS.md:10` annonce Next 15 ; manifeste, lockfile et installation indiquent Next 16.3.6.
- `AGENTS.md:18-19` annonce des commandes de tests dont l'outillage n'existe pas dans le projet inspecté.
- `AGENTS.md:5-6,23-24` conserve des champs d'identité et de règles métier à remplir. `README.md:1-36` reste le guide générique create-next-app. Les deux sont insuffisants pour attester les contrats métier ou les procédures d'exploitation réelles.
- AGENTS apparaît non suivi lors de `git status --short --branch` et n'apparaît pas dans `git ls-files AGENTS.md` ; son contenu local ne doit pas être assimilé à une configuration déjà versionnée.
- `.gitignore:33` ignore `.env*`, `:17` ignore `.next`, `:39` ignore le cache TypeScript ; aucun contenu secret n'a été lu.

## Traçabilité et limites

Commandes réellement exécutées : lectures `cat`, `nl -ba`, `sed`, inventaires/recherches `rg --files` et `rg -n` sur les périmètres ci-dessus ; `git status --short --branch`, `git log -1 --format='%h %ad %s' --date=iso-strict`, `git ls-files` sur les manifests/configs/tests ; `node --version`, `npm --version` ; scripts Node locaux lisant uniquement des JSON de manifestes/lockfile et appelant `semver.satisfies` ; commande `tsc` reproduite ci-dessus ; `test -f` des scripts de harness utilisateur sous `~/.gemini/config/skills/autonomous-qa/scripts/` et `~/.agents/skills/autonomous-qa/scripts/` (tous deux présents, code 0).

Lectures et comparaisons locales : PASS. Typage : FAIL. Tests, lint, build, navigateur, CI et harness : **non exécutés**. Aucune conclusion sur la santé de la production, la qualité effective des données, la sécurité à l'exécution, les performances, l'accessibilité mesurée, la couverture ou une installation propre. Aucune correction proposée ici n'a été implémentée.
