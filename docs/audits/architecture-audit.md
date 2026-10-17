# Audit architecture et données — Veyl

Audit statique du 15/10/2026. Racine des références : `/Users/theomichels/App/veyl`. Aucun serveur, appel API/base, seed ou migration exécuté ; aucun fichier `.env` consulté. **OBSERVÉ** signifie présent dans les sources, pas validé à l'exécution.

## Fiche comparable

| Axe | Constat et preuve |
|---|---|
| Finalité observée | Veille par catégories `IA`, `Luxembourg`, `Tech`, synthèses enregistrées et approfondissement à la demande : `src/app/api/cron/[category]/route.ts:12`, `src/app/api/go-further/route.ts:4`. |
| Application | **OBSERVÉ** : Next App Router, React, TypeScript ; Next déclaré `^16.3.6`, React épinglé à une RC 19 dans `package.json:19`, `package.json:22` ; TS strict activé dans `tsconfig.json:11`. Versions verrouillées et compatibilité : rapport qualité. **DÉCLARÉ** : Next 15 dans `AGENTS.md:10`, donc documentation divergente. |
| Architecture serveur | **OBSERVÉ** : lectures Prisma dans une page serveur, mutations dans des Server Actions, endpoints HTTP, adaptateurs RSS/Gemini dans `src/lib`. Pas de couche repository dans ce périmètre ; plusieurs instances directes `PrismaClient` : `src/app/page.tsx:6`, `src/app/settings/actions.ts:6`, `src/app/api/cron/[category]/route.ts:10`. |
| Stockage | **OBSERVÉ** : schéma Prisma configuré pour PostgreSQL, variables nommées `DATABASE_URL` et `DIRECT_URL` (`prisma/schema.prisma:1`). **DÉCLARÉ** : SQLite local dans `AGENTS.md:12`. Le verrou de migration indique encore SQLite (`prisma/migrations/migration_lock.toml:3`). Hébergeur, données réellement présentes et migrations appliquées : **INCONNUS**. |
| IA | **OBSERVÉ** : SDK Google GenAI (`package.json:13`, `src/lib/gemini.ts:1`), liste de cinq modèles de repli dans les sources, trois essais maximum par modèle (`src/lib/gemini.ts:16`, `src/lib/gemini.ts:24`). Existence, disponibilité et coûts effectifs de ces modèles : **INCONNUS**, non vérifiés auprès du service. |
| Sources externes | **OBSERVÉ** : `rss-parser` et `fetch` serveur (`src/lib/rss.ts:1`, `src/lib/rss.ts:9`). Onze sources candidates dans le seed, réparties entre les trois catégories (`prisma/seed.js:24`). Leur présence effective en base et disponibilité : **INCONNUES**. |
| Planification | **OBSERVÉ** : `vercel.json:2` déclare les routes IA/Tech à `0 3 * * 1-5`, Luxembourg à `0 3 * * 5`. Ce fichier prouve une intention de planification, pas un déploiement Vercel ni des exécutions réussies. Fuseau effectivement utilisé et planificateur actif : **INCONNUS**. |

## Modèle de données observé

- `Digest` : identifiant CUID, catégorie libre, titre, contenu texte, date de création (`prisma/schema.prisma:12`). Pas de lien vers les articles ou sources utilisés, de statut de génération, d'unicité catégorie/date ou d'index explicite hors clé primaire dans le schéma inspecté.
- `Source` : CUID, nom, URL unique, catégorie libre, activation booléenne (`prisma/schema.prisma:20`). L'unicité est portée par l'URL, pas par URL + catégorie.
- `Settings` : identifiant avec défaut `default`, trois prompts et activation du cron (`prisma/schema.prisma:28`). Le code traite `default` comme singleton ; le schéma n'interdit pas d'autres identifiants. Le seed crée cet enregistrement par `upsert` (`prisma/seed.js:5`) ; son exécution n'a pas été vérifiée.
- **Écart à documenter avant toute future migration** : l'unique migration inspectée contient une structure SQLite avec `DATETIME` et seulement deux prompts (`prisma/migrations/20260922081028_init/migration.sql:7`, `:20`), tandis que le schéma courant cible PostgreSQL et ajoute `geminiPromptTech` (`prisma/schema.prisma:32`). Cela établit une divergence de sources ; cela ne permet pas de conclure à l'état de la base ni à l'échec certain d'une commande non exécutée.

## Flux observés

1. **Génération** : `GET /api/cron/[category]` valide le slug, lit `Settings.default`, s'arrête si le cron est désactivé, puis lit les sources actives (`src/app/api/cron/[category]/route.ts:18`, `:29`, `:34`). Dernier digest comme date de coupure ; sinon recul de deux jours pour IA/Tech, huit jours pour Luxembourg (`:49`). Collecte parallèle avec `Promise.allSettled`, filtre des dates et concaténation (`:66`). Prompt par catégorie → Gemini → insertion d'un digest (`:87`, `:107`). Aucun nouvel article : réponse 200 sans création (`:83`).
2. **Lecture** : page serveur dynamique, chargement de tous les digests triés par date décroissante, regroupement en mémoire par jour, conservation du plus récent de chaque catégorie pour ce jour, transmission à `ClientHome` (`src/app/page.tsx:7`, `:10`, `:14`, `:25`, `:40`). Pas de pagination dans cette lecture. Le regroupement ne fixe pas explicitement de fuseau (`:15`).
3. **Administration** : Server Actions de modification des prompts, ajout/activation/suppression des sources, puis invalidation de `/settings` (`src/app/settings/actions.ts:8`, `:21`, `:33`, `:41`). `saveSettings` utilise `update`, qui suppose l'enregistrement `default` existant (`:13`). Aucune action de changement de `cronEnabled` dans ce fichier.
4. **Approfondissement** : `POST /api/go-further` lit `text`, demande une réponse Gemini avec outil Google Search, renvoie `{ content }` (`src/app/api/go-further/route.ts:6`, `src/lib/gemini.ts:56`, `:81`). Aucune persistance de cet approfondissement dans les handlers inspectés.

## Limites et points de comparaison

- **OBSERVÉ** : les handlers et Server Actions inspectés n'effectuent aucun contrôle explicite d'identité/autorisation ; le GET de génération déclenche des effets et des appels payants. Une protection externe ou applicative ailleurs n'est pas établie par ce périmètre. Le simple enregistrement d'un cron ne protège pas sa route.
- **OBSERVÉ** : aucune validation de schéma externe dans ces entrées ; les `FormData` sont castées en chaînes (`src/app/settings/actions.ts:9`, `:22`) ; le POST ne vérifie que la présence de `text` (`src/app/api/go-further/route.ts:7`). L'URL enregistrée est ensuite utilisée par le fetch serveur (`src/lib/rss.ts:9`) : contrôle du protocole, des destinations et des redirections à prévoir si l'administration devient accessible à des tiers.
- **OBSERVÉ** : texte complet envoyé à l'approfondissement journalisé (`src/app/api/go-further/route.ts:11`), messages d'erreur retournés tels quels (`:18`, `src/app/api/cron/[category]/route.ts:118`). Contenu RSS transmis à Gemini, sortie non contrôlée par un schéma (`src/lib/gemini.ts:14`, `:34`).
- **OBSERVÉ** : troncature globale à 100 000 caractères (`src/lib/gemini.ts:14`), dates de publication absentes remplacées par la date courante (`src/lib/rss.ts:30`), échec RSS ramené à un tableau vide (`:32`). Risques de couverture partielle sans état dédié ; pas de déduplication d'articles ou garde de concurrence explicite dans le cron inspecté.
- **OBSERVÉ** : configuration `timeout: 5000` sur le parser (`src/lib/rss.ts:3`) mais requête effectuée via un `fetch` séparé sans signal d'abandon (`:9`). Le délai réseau effectif ne peut pas être déduit de cette option. Revalidation demandée à 3 600 secondes (`:15`).
- **OBSERVÉ** : commentaires de catégories du schéma encore limités à IA/Luxembourg malgré la troisième catégorie utilisée (`prisma/schema.prisma:14`, `:24`). `prisma.config.ts:3` configure des agents/skills ; ne constitue pas une configuration d'hébergement/base.

## Socle commun avec variantes — PROPOSÉ, sans modification

- Socle transversal à comparer : TypeScript strict réellement vérifié, contrats d'entrée, couche d'accès aux données explicite, protection des mutations, gestion des erreurs/journaux, migrations cohérentes, tests et sauvegardes. Ce sont des critères de cible, pas des capacités déjà établies.
- Variante Veyl : application de consultation et enrichissement de contenu, ingestion périodique, appels IA côté serveur et traçabilité des sources/générations. Cela n'impose pas la même base ou stratégie de déploiement à une app purement locale ou mobile.
- Inconnues à conserver dans la fiche : hébergeur réel, authentification effective, variables présentes, base active, sauvegardes, historique de migrations appliqué, exécution des crons, quotas/coûts IA, volumétrie et santé des sources. Aucune conclusion de production dans cet audit.
