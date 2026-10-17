# Fiche d’application — <nom>

> Format : `application-profile/1.0` · Fiche : `0.1` · Mise à jour : `<AAAA-MM-JJ>`
> Statut : état des lieux / cible proposée / cible validée.
> Révision examinée : `<commit>` ; préciser les modifications locales incluses.
> Responsable : `<nom>` · Famille : `<web-contenu | web-interactif | mobile | autre>`.
> Référentiel commun comparé : `<nom + version, ou « proposition non validée »>`.

Cette fiche distingue les faits sur l’application, les exigences communes et les variantes choisies. Elle ne vaut pas autorisation de migration.

## 1. Finalité et contraintes

| Champ | Valeur |
|---|---|
| Identifiant stable | `<app-id>` |
| Utilité principale | `<problème résolu en deux phrases>` |
| Public et accès | `<personnel / équipe / public ; identification et autorisations>` |
| Parcours essentiels | `<3 à 5 parcours>` |
| Supports | `<desktop, mobile web, application native, installation>` |
| Connexion / hors ligne | `<exigence et comportement réel>` |
| Données à conserver | `<données critiques ; sensibilité ; export ; rétention>` |
| Contraintes d’exploitation | `<budget, fréquence, volumétrie, latence, disponibilité>` |
| Dépendances externes | `<fournisseurs indispensables et alternatives>` |

Écrire **INCONNU** lorsqu’une contrainte n’a pas été confirmée. Ne pas transformer une préférence supposée en exigence.

## 2. Méthode et niveau de preuve

| Marqueur | Signification |
|---|---|
| OBSERVÉ | Présent dans les sources ou la configuration examinées. |
| EXÉCUTÉ | Contrôle réellement lancé ; joindre commande, date, résultat et contexte. |
| DÉCLARÉ | Annoncé par la documentation, sans confirmation indépendante. |
| INCONNU | Information non établie ; noter comment la vérifier. |
| PROPOSÉ | Cible ou action soumise à une décision ultérieure. |

Préciser : périmètre lu, environnement, commandes exécutées, tests exclus et leurs raisons. Une configuration de déploiement ne prouve pas un déploiement actif. Une règle CSS ne prouve pas un rendu accessible. Un test absent n’a pas « passé ».

## 3. Stack effective

| Élément | Version déclarée | Version verrouillée | Version exécutée | Preuve |
|---|---|---|---|---|
| Runtime et gestionnaire de paquets | | | | |
| Framework et mode de rendu | | | | |
| Langage et typage | | | | |
| UI, styles, icônes | | | | |
| Stockage, ORM, migrations | | | | |
| Validation des entrées | | | | |
| Tests unitaires / intégration | | | | |
| Tests de parcours / E2E | | | | |
| Services externes | | | | |
| Hébergement et tâches planifiées | | | | |

Ne pas déduire la version exécutée du seul fichier de verrouillage. Lister séparément les contradictions entre documentation et code.

## 4. Architecture et flux

Décrire les responsabilités de l’interface, du métier, de l’accès aux données et des intégrations. Ajouter un schéma compact si plusieurs couches ou services interagissent.

| Parcours | Entrée | Traitement | Données lues / écrites | Échec et reprise | Preuve |
|---|---|---|---|---|---|
| `<parcours>` | | | | | |

Préciser : état temporaire/persistant, frontières client/serveur, règles métier, validation, autorisation, doublons, concurrence, fuseaux horaires et limites de volumétrie.

## 5. Données, sécurité et exploitation

| Sujet | Situation réelle | Inconnu ou écart | Preuve |
|---|---|---|---|
| Modèles, relations, contraintes | | | |
| Source de vérité du schéma et migrations | | | |
| Accès et séparation des utilisateurs | | | |
| Validation des entrées externes | | | |
| Secrets et configuration | `<noms des variables uniquement>` | | |
| Sauvegarde, restauration, export | | | |
| Appels externes, quotas et coûts | | | |
| Logs, diagnostic, alertes | | | |
| Déploiement et retour arrière | | | |

Ne jamais inclure de valeur de secret, de copie de données privées ou d’adresse de connexion sensible.

## 6. Tests et contrôles de qualité

| Contrôle | Outillage et commande réels | Couverture fonctionnelle | Dernier résultat | Preuve |
|---|---|---|---|---|
| Typage | | | | |
| Lint | | | | |
| Unitaire | | | | |
| Intégration | | | | |
| E2E et persistance après rechargement | | | | |
| Build | | | | |
| Harness strict et CI | | | | |
| Navigateur, responsive, accessibilité | | | | |

Résultats autorisés : **PASS**, **FAIL**, **NON EXÉCUTÉ** avec raison, **ABSENT**. Une couverture non mesurée est **INCONNUE**. Un script qui affiche une réponse d’API n’est pas une suite de non-régression.

Lister ensuite les scénarios à protéger et leurs résultats attendus, avec les doublures nécessaires pour éviter les appels payants ou les écritures de production.

## 7. Principes d’interface, hors direction artistique

| Dimension | Existant observé | Principe commun visé | Variante admise | Preuve |
|---|---|---|---|---|
| Structure et navigation | | | | |
| Hiérarchie, densité, lisibilité | | | | |
| Surfaces, espacements, arrondis | | | | |
| Tokens et composants partagés | | | | |
| Responsive et interactions tactiles | | | | |
| Thèmes et préférences | | | | |
| Clavier, focus, labels, zoom | | | | |
| Langue, dates, nombres, devises | | | | |
| Animations et retours d’action | | | | |

| Parcours | Chargement | Vide | Erreur et reprise | Succès |
|---|---|---|---|---|
| `<parcours>` | | | | |

Logo, palette de marque, illustrations et personnalité visuelle restent des choix d’application. Évaluer les principes de fonctionnement et de cohérence indépendamment de ces choix.

## 8. Matrice de comparaison

Conserver ces identifiants entre applications. Ajouter des lignes sans renommer les critères existants. Le **périmètre** indique où la règle s’applique : **COMMUN**, **VARIANTE** ou **MÉTIER**. La **situation** vaut **EN PLACE**, **PARTIEL**, **ABSENT**, **INCONNU** ou **NON APPLICABLE** justifié. Elle décrit la mise en place, pas une certification.

| ID | Critère | Périmètre | Valeur observée | Situation | Cible / référence | Preuve |
|---|---|---|---|---|---|---|
| DOC-01 | Documentation et commandes fiables | COMMUN | | | | |
| STK-01 | Famille de framework | VARIANTE | | | | |
| STK-02 | Dépendances et environnement reproductibles | COMMUN | | | | |
| ARC-01 | Séparation interface / métier / données | COMMUN | | | | |
| DAT-01 | Stockage adapté à l’usage | VARIANTE | | | | |
| DAT-02 | Schéma unique et migrations cohérentes | COMMUN | | | | |
| DAT-03 | Sauvegarde, restauration, portabilité | COMMUN | | | | |
| SEC-01 | Validation des entrées externes | COMMUN | | | | |
| SEC-02 | Accès et autorisations adaptés à l’exposition | COMMUN | | | | |
| SEC-03 | Gestion des secrets et configuration | COMMUN | | | | |
| TST-01 | Typage strict et lint exécutables | COMMUN | | | | |
| TST-02 | Tests unitaires métier déterministes | COMMUN | | | | |
| TST-03 | Tests d’intégration des données et contrats | COMMUN | | | | |
| TST-04 | E2E des parcours critiques et persistance | COMMUN | | | | |
| TST-05 | Harness reproductible et preuve indépendante | COMMUN | | | | |
| UX-01 | Tokens et composants cohérents | COMMUN | | | | |
| UX-02 | Chargement, vide, erreur, succès | COMMUN | | | | |
| UX-03 | Responsive et accessibilité | COMMUN | | | | |
| UX-04 | Politique de thème et préférences | VARIANTE | | | | |
| UX-05 | Langue et formats cohérents | COMMUN | | | | |
| OPS-01 | Diagnostic, quotas et gestion des échecs | COMMUN | | | | |
| OPS-02 | Livraison, automatisation et retour arrière | COMMUN | | | | |
| BIZ-01 | Fonctionnalités spécifiques | MÉTIER | | | | |

Comparer les preuves à périmètre et version de référentiel identiques. Une variante justifiée n’est pas une dette. Ne pas calculer de score global qui masquerait un contrôle absent ou inconnu.

## 9. Trajectoire de convergence proposée

| Ordre | Écart | Action et dépendances | Acceptation mesurable | Impact sur les données | Retour arrière | Effort à confirmer |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

Commencer par protéger les comportements et les données ; ne changer un framework ou un stockage que pour une exigence identifiée. Distinguer les améliorations locales des décisions communes à plusieurs applications.

## 10. Décisions et maintenance

| Décision | Statut | Motif | Responsable / date |
|---|---|---|---|
| Socle commun + variantes | `<validé/proposé>` | | |

Mettre à jour la fiche lors d’un changement de stack, de schéma, d’exposition, de parcours essentiel ou de commande qualité. Faire évoluer le format et la cible commune avec une version explicite ; garder la trace des variantes acceptées.

## 11. Sources et limites

Référencer les fichiers et lignes utiles, les rapports et les contrôles réellement exécutés. Lister explicitement ce qui demande une vérification en environnement réel avant de planifier une migration.
