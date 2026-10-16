# Plan d'implémentation — local-db-storage

## 1. Objectif
Permettre à l'application d'utiliser un stockage SQLite local (`prisma/dev.db`, non versionné dans Git) lors du développement local (`npm run dev`), tout en conservant la connexion à Supabase PostgreSQL intacte et prête pour le déploiement de production sur Vercel (`prisma/schema.prisma` officiel, `DATABASE_URL` et `DIRECT_URL` distants).

## 2. Décisions de cadrage
| Question | Réponse retenue |
|---|---|
| Moteur de stockage local | SQLite via fichier `prisma/dev.db` (aucun service externe requis, léger, déjà ignoré par Git). |
| Source de vérité du schéma | `prisma/schema.prisma` (PostgreSQL) reste la source unique officielle de vérité. Le schéma SQLite local `prisma/schema.local.prisma` est dérivé automatiquement à la volée. |
| Déclencheur du mode local | Le script `npm run dev` prépare automatiquement la base SQLite locale (`db push` + `prisma generate` local) avant de lancer le serveur Next.js. |
| Comportement sur Vercel | Vercel exécute `prisma generate` sur `prisma/schema.prisma` via `postinstall` et se connecte à Supabase via ses variables d'environnement distantes. |
| Données locales | Le fichier existant `prisma/dev.db` est conservé pour préserver les veilles/sources locales de l'utilisateur. |

## 3. Mode d'équipe
Fast-track (`fullstack-builder` -> `qa-inspector`) : modification ciblée de la configuration base de données et des scripts de lancement, sans nouvel écran ni modification du modèle métier.

## 4. Architecture
- **Source de vérité du schéma** : `prisma/schema.prisma` (fournisseur PostgreSQL pour Supabase).
- **Schéma dérivé local** : `prisma/schema.local.prisma` (fournisseur SQLite pour le dev local, ignoré par Git).
- **Script d'initialisation locale** : `scripts/setup-local-db.mjs` qui :
  1. Lit `prisma/schema.prisma` et génère `prisma/schema.local.prisma` avec `provider = "sqlite"`.
  2. Pousse les tables vers `prisma/dev.db` via `prisma db push`.
  3. Génère le client Prisma local via `prisma generate --schema=prisma/schema.local.prisma`.
  4. S'assure que `Settings` par défaut existe en local.
- **Environnement local** : `.env.local` configuré avec `DATABASE_URL="file:./dev.db"` (non commité).

## 5. UI
Aucune modification d'interface requise.

## 6. Critères d'acceptation (AC)
- **AC-01** : En local (`npm run dev` ou script local), Prisma se connecte à SQLite (`prisma/dev.db`) sans aucune requête vers Supabase distant.
- **AC-02** : Le fichier SQLite `prisma/dev.db` et le schéma dérivé `prisma/schema.local.prisma` sont rigoureusement ignorés par Git (`.gitignore`).
- **AC-03** : Le schéma officiel `prisma/schema.prisma` conserve `provider = "postgresql"` pour le build et le déploiement Vercel.
- **AC-04** : Les requêtes locales (lecture/écriture de Digests, Sources, Settings) fonctionnent sur la base locale SQLite.
- **AC-05** : La commande `postinstall` (`npx prisma generate`) sur le schéma de production PostgreSQL compile sans erreur pour Vercel.

## 7. Contrat de tests & vérification
| AC | Type | Méthode de vérification |
|---|---|---|
| AC-01 | Intégration | Script de test lisant et écrivant dans `prisma/dev.db` via le client local sans accès réseau Supabase. |
| AC-02 | Contrôle Git | `git status --ignored` vérifie que `dev.db` et `schema.local.prisma` sont bien ignorés. |
| AC-03 | Unitaire | Validation que `prisma/schema.prisma` a `provider = "postgresql"` et `directUrl`. |
| AC-04 | Intégration | Test de requêtes CRUD Prisma sur la base SQLite locale. |
| AC-05 | Build | Exécution de `npx prisma generate` avec `DATABASE_URL` factice Postgres pour valider la compatibilité Vercel. |

## 8. Découpage & périmètres
| Sous-agent | Mission | Fichiers autorisés | Workspace |
|---|---|---|---|
| fullstack-builder | Mise en place du script local, adaptation de `.gitignore`, `.env.local`, `package.json`, et script de test local | `scripts/*`, `package.json`, `.gitignore`, `.env.local`, `tests/*`, `src/lib/prisma.ts` | inherit |
| qa-inspector | Vérification zero-trust de la persistance locale et de la compatibilité Vercel | Aucun (lecture seule) | inherit |

## 9. Risques & hors périmètre
- Risque : Désynchronisation de schéma si `schema.local.prisma` est modifié manuellement. -> Atténué par la génération automatique depuis `prisma/schema.prisma`.
- Hors périmètre : Migration des données de Supabase vers le local (l'utilisateur a déjà son dev.db local ou une base vierge).
