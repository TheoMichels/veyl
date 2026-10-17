# Socle commun des applications — proposition 0.1

Date : 15 octobre 2026. Statut : **PROPOSÉ, à valider**. Pilote : Veyl.

Ce document fixe une base de comparaison ; il n'autorise aucune migration. Il complète les règles de développement existantes par des critères vérifiables. La fiche [Veyl](application-profile.md) décrit l'existant ; le [modèle de fiche](application-profile.template.md) sert aux autres applications.

## 1. Ce qui doit être commun

Le socle porte sur la qualité, les frontières d'architecture, les principes d'interface et l'exploitation. Il ne nécessite pas que toutes les applications utilisent le même framework, le même hébergeur ou la même palette.

| ID | Exigence proposée | Preuve d'acceptation attendue |
|---|---|---|
| DOC-01 | Une fiche à jour et un `AGENTS.md` fidèle au projet | Commandes, modèle de données, port de preview et mode d'équipe documentés ; écarts explicites |
| STK-02 | Installation reproductible | Lockfile, runtime et gestionnaire précisés ; versions compatibles ; installation vérifiée dans un environnement propre |
| ARC-01 | Séparer rendu, règles métier, accès aux données et fournisseurs | Métier testable sans interface ; accès persistants derrière des repositories ; fournisseurs derrière des adaptateurs |
| DAT-02 | Une source de vérité du schéma | Historique de migrations compatible avec le moteur réel ; reconstruction testée sur une base isolée |
| DAT-03 | Protéger les données qui comptent | Sauvegarde, restauration testée et export adaptés à la criticité ; responsabilités et rétention documentées |
| SEC-01 | Valider chaque entrée externe | Schémas Zod ou équivalent justifié aux frontières serveur/stockage ; limites de taille ; erreurs utilisables ; URL réseau contrôlées si elles sont fournies par l'utilisateur |
| SEC-02 | Adapter les accès à l'exposition | Exposition connue ; mutations et appels payants réservés aux acteurs autorisés ; tâches planifiées protégées si accessibles sur le réseau |
| SEC-03 | Garder les secrets côté serveur | Aucun secret suivi ou embarqué côté client ; exemple de configuration sans valeurs ; erreurs et logs sans données sensibles |
| TST-01 | Typage strict et lint bloquants | Commandes dédiées en succès ; absence de contournement global des erreurs ; exceptions locales justifiées |
| TST-02 | Protéger les règles métier par des tests unitaires | Tests déterministes des décisions et cas limites ; horloge/réseau/IA simulés ; aucune dépendance à un modèle payant |
| TST-03 | Vérifier les contrats et la persistance | Tests d'intégration sur données isolées : contraintes, migrations, erreurs, validation et autorisation |
| TST-04 | Vérifier les parcours essentiels dans le navigateur | E2E avec succès, vide, erreur, rechargement des données persistantes et absence d'erreurs console inattendues |
| TST-05 | Une commande de vérification et une preuve | Harness `--strict` disponible dans le projet ou avec dépendance versionnée ; détail PASS/FAIL/SKIPPED ; QA indépendante après modification applicative |
| UX-01 | Un vocabulaire de composants et tokens cohérent | Rôles sémantiques des couleurs, échelle d'espacement/typo/arrondis, boutons et champs partagés ; implémentation adaptée à la stack |
| UX-02 | Quatre états définis pour chaque parcours asynchrone | Chargement, vide, erreur avec reprise, succès ; retour explicite sur les mutations et les résultats partiels |
| UX-03 | Des parcours accessibles sur les supports cibles | Clavier et focus visibles, labels associés, zoom possible, contrastes et cibles tactiles vérifiés, responsive sans perte d'action |
| UX-05 | Une interface française cohérente | Messages français, formats explicites et fuseau métier défini ; code et identifiants anglais |
| OPS-01 | Pouvoir diagnostiquer et maîtriser les échecs | Logs structurés sans contenu sensible, délais bornés, reprises/idempotence si nécessaire, quotas et coûts des fournisseurs explicités |
| OPS-02 | Livraison contrôlée et réversible | Vérifications avant livraison, procédure de déploiement et retour arrière ; automatisation adaptée ; aucune écriture distante sans autorisation applicable |

Le seuil de couverture n'est pas fixé arbitrairement à un pourcentage. La première exigence est la protection des règles et parcours critiques identifiés dans chaque fiche. Une mesure de couverture peut compléter cette preuve.

## 2. Variantes admises

| ID | Décision variable | Valeur de départ | Justification à consigner |
|---|---|---|---|
| STK-01 | Framework | Next.js pour contenu/SSR/dashboard ; Expo pour usages mobiles/interactifs, conformément aux conventions existantes | Supports, mode hors ligne, SEO, interactions ; conserver un existant viable sauf besoin contraire |
| DAT-01 | Stockage et hébergement | SQLite pour usage local compatible ; base serveur pour usage distant/concurrent ; ORM adapté | Concurrence, volumétrie, mobilité des données, opérations et coût ; un seul mécanisme de migrations |
| UX-04 | Politique de thème | Système avec choix utilisateur lorsque les deux thèmes sont proposés | Usage de l'application et accessibilité ; préférence respectée après rechargement |
| BIZ-01 | Services et règles métier | Choix propre à l'application | Fournisseur IA, catégories, fréquence de traitement, règles de conservation et intégrations |

Les couleurs de marque, le logo, les illustrations, la forme de la navigation et la densité exacte restent propres à l'application. Leurs contraintes d'accessibilité et leurs rôles fonctionnels relèvent du socle.

Une variante acceptée contient : **choix, motif, périmètre, responsable, date, condition de réexamen**. Une application locale personnelle peut fonctionner sans comptes si cette frontière est réellement garantie ; une exposition distante doit être évaluée séparément.

## 3. Principes de style global

Style proposé : **sobre, lisible, cohérent, adaptatif et explicite dans ses retours**. Les applications peuvent garder leur personnalité visuelle.

- Hiérarchie : un titre de page clair, une action principale identifiable, les actions secondaires en retrait.
- Composition : espacements issus d'une échelle, alignements réguliers, largeur de lecture maîtrisée pour les contenus longs, densité adaptée à la tâche.
- Surfaces : contrastes fonctionnels entre fond, panneau et contrôle ; bordures et ombres discrètes ; arrondis cohérents.
- Composants : mêmes comportements pour bouton, champ, confirmation, message d'erreur et état vide au sein d'une famille d'applications.
- Interaction : attente visible, prévention des doubles soumissions, feedback de succès ou d'échec ; confirmation ou annulation proportionnée pour une suppression.
- Accessibilité : sémantique, navigation au clavier, focus, labels, zoom, réduction des animations et informations ne reposant pas sur la couleur seule.
- Responsive : vérifier au minimum les supports réellement visés ; transformer la navigation lorsque nécessaire en conservant les actions essentielles.

Un socle commun peut d'abord être une spécification et une grille de contrôle. Extraire une bibliothèque partagée seulement après avoir identifié des usages réellement identiques sur plusieurs applications.

## 4. Comment comparer deux applications

1. Copier le modèle de fiche et conserver ses identifiants de critères.
2. Relever les faits, leurs sources et le niveau de preuve ; laisser les inconnues visibles.
3. Utiliser la même version de socle pour les applications comparées.
4. Lire chaque critère comme : **valeur réelle → situation → cible → preuve → action éventuelle**.
5. Décider si un écart est une lacune, une variante justifiée ou un besoin métier distinct.
6. Planifier les corrections selon le risque pour les données et l'usage, puis le coût de maintenance.

Situations : **EN PLACE**, **PARTIEL**, **ABSENT**, **INCONNU**, **NON APPLICABLE** avec justification. Elles décrivent la mise en place ; seule une vérification exécutée permet d'affirmer qu'un contrôle fonctionne. Aucun score global ne doit masquer un blocage.

## 5. Décisions à prendre après le pilote

| Proposition | Recommandation | Statut |
|---|---|---|
| Socle transversal avec variantes par famille | Retenir les exigences de résultat ci-dessus et justifier les exceptions | PROPOSÉ |
| Veyl comme référence | Utiliser Veyl pour éprouver la fiche ; sa situation actuelle ne définit pas automatiquement la cible | PROPOSÉ |
| Première convergence | Corriger d'abord documentation, contrôles et protection des données/accès ; préserver les fonctionnalités | PROPOSÉ |
| Validation sur un deuxième cas | Comparer ensuite une application d'une autre famille avant de figer un socle 1.0 | PROPOSÉ |

À chaque évolution, versionner le référentiel et réévaluer les critères concernés dans les fiches. Les fiches restent des documents de décision ; les instructions de travail des agents demeurent dans `AGENTS.md` et les skills.
