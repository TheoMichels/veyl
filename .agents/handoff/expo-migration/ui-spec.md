# UI Spec — expo-migration

## Parcours
1. **Consultation des synthèses par catégorie et par date (AC-02, AC-03)** : Ouverture de l'application sur la vue Veille (`DigestDashboard`) → sélection d'un onglet de catégorie (`tab-ia`, `tab-lux`, `tab-tech`) → sélection d'une date dans l'historique (`history-date-<dateStr>`, en barre latérale repliable sur desktop ou accordéon `mobile-history-trigger` sur mobile `< 768px`) → lecture de la synthèse formatée en sections avec date relative en français.
2. **Approfondissement IA « Aller plus loin » (AC-04)** : Depuis une section ou puce d'actualité → clic sur le bouton étincelle (`go-further-btn-<idx>`) → ouverture de la carte d'approfondissement (`expanded-details-card`) en état `loading`, puis affichage de la synthèse détaillée (`populated`) ou d'un message d'erreur maîtrisé en français (`error`) → fermeture via `expanded-details-close-btn`.
3. **Génération quotidienne de la veille (AC-05)** : Depuis la barre latérale / en-tête de veille → clic sur « Générer la veille du jour » (`generate-digest-btn`) → passage du bouton en état désactivé « Génération... » → rafraîchissement des synthèses des 3 catégories ou affichage d'une bannière d'erreur en français.
4. **Gestion des Paramètres Gemini & Sources RSS (AC-06, AC-07)** : Clic sur `nav-settings-btn` dans `Header` → édition des 3 prompts Gemini (`prompt-ia-input`, `prompt-lux-input`, `prompt-tech-input`) et sauvegarde (`save-settings-btn`) → ajout d'une source RSS (`source-name-input`, `source-url-input`, `source-category-select`, `add-source-btn`) avec validation `zod` → bascule Actif/En pause (`toggle-source-<id>`) ou suppression (`delete-source-<id>`) → retour à la veille via `nav-home-btn`.
5. **Bascule de thème Clair / Sombre (AC-02)** : Clic sur `theme-toggle-btn` dans `Header` → mise à jour instantanée du dégradé de fond (`LinearGradient`) et des surfaces/textes via `getThemeColors(mode)`.

## Écrans & composants
| Écran / composant | Fichier | Nouveau / modifié | Rôle |
|---|---|---|---|
| Racine de l'application | `App.tsx` | Nouveau | Conteneur principal Expo (`LinearGradient`, état `themeMode` Clair/Sombre, navigation `viewMode` entre `'dashboard'` et `'settings'`, chargement initial des données). |
| Barre supérieure | `src/components/Header.tsx` | Nouveau | En-tête collant avec logo Radar (`react-native-svg` dans un badge dégradé Indigo/Violet), titre « Veyl », bouton de bascule Clair/Sombre (`theme-toggle-btn`) et bouton de navigation Veille/Paramètres (`nav-settings-btn` / `nav-home-btn`). |
| Tableau de bord de veille | `src/components/DigestDashboard.tsx` | Nouveau | Vue principale avec panneau d'historique par date (barre latérale desktop `sidebar-toggle-btn` / accordéon mobile `mobile-history-trigger`), bouton `generate-digest-btn`, barre d'onglets (`tab-ia`, `tab-lux`, `tab-tech`) et zone de lecture de la synthèse. |
| Section d'actualité & Approfondissement | `src/components/ExpandableNewsSection.tsx` | Nouveau | Découpage du Markdown de synthèse en blocs et puces, boutons d'approfondissement IA (`go-further-btn-<idx>`) et carte `expanded-details-card` avec bouton `expanded-details-close-btn`. |
| Vue Paramètres & Sources RSS | `src/components/SettingsView.tsx` | Nouveau | Formulaire d'édition des 3 prompts Gemini (`prompt-ia-input`, `prompt-lux-input`, `prompt-tech-input`, `save-settings-btn`) et gestionnaire CRUD des sources RSS (`source-name-input`, `source-url-input`, `source-category-select`, `add-source-btn`, `toggle-source-<id>`, `delete-source-<id>`). |

## États
| Vue | Loading | Empty | Error | Populated |
|---|---|---|---|---|
| **Vue Veille (`DigestDashboard`)** | Skeleton structuré (blocs pulsants pour la liste de dates et 3 cartes de sections) + état actif « Génération... » sur `generate-digest-btn` | Bloc `empty-state` avec icône calendrier/étincelle, texte « Aucune synthèse {Catégorie} générée pour cette date. » ou « Aucune veille disponible. » et CTA `generate-digest-btn` | Bannière `error-banner` non bloquante en français (fond `dangerSoft`, bordure `dangerBorder`) avec bouton « Réessayer » | Historique des dates (`history-date-<dateStr>`), en-tête de catégorie coloré, titre, date relative en français (`date-fns` locale `fr`) et sections Markdown |
| **Carte Approfondissement IA (`ExpandableNewsSection`)** | Carte `expanded-details-card` affichant un indicateur rotatif + « Recherche et synthèse en cours... » | Fermée par défaut (`null` tant qu'aucun clic sur `go-further-btn-<idx>`) | Message d'erreur encadré en français à l'intérieur de `expanded-details-card` (ex. clé Gemini absente ou erreur réseau) + bouton `expanded-details-close-btn` | Carte `expanded-details-card` avec bordure gauche `primary`, badge « Approfondissement IA », texte structuré et bouton `expanded-details-close-btn` |
| **Vue Paramètres (`SettingsView`)** | Skeleton sur les 3 champs de prompts et la liste de sources + bouton désactivé pendant sauvegarde/ajout | Message explicite en français « Aucune source RSS configurée. Ajoutez votre premier flux ci-dessous. » dans la liste des sources | Bannière d'erreur de validation `zod` ou API en français (ex. « URL du flux RSS invalide », « Le nom de la source est requis ») + confirmation de sauvegarde | 3 `TextInput` multilignes pré-remplis, liste des sources avec badge de catégorie, lien URL, badge `Actif`/`En pause` (`toggle-source-<id>`) et action `Supprimer` (`delete-source-<id>`) |

## Tokens utilisés
- **Couleurs (`src/theme/colors.ts`)** :
  - Fond & Surfaces : `background`, `backgroundSecondary`, `surface`, `surfaceElevated`, `surfaceTranslucent`, `surfaceMuted`, `headerBg`, `border`, `borderSubtle`
  - Typographie : `textPrimary`, `textSecondary`, `textMuted`, `textInverse`
  - Identité Veyl : `primary` (`#4F46E5` clair / `#6366F1` sombre), `primaryHover`, `primarySoft`, `primaryBorder`, `accentViolet` (`#7C3AED` clair / `#8B5CF6` sombre)
  - Accents par catégorie :
    - IA : `categoryIA` (`#4F46E5` clair / `#818CF8` sombre) & `categoryIASoft`
    - Luxembourg : `categoryLux` (`#2563EB` clair / `#60A5FA` sombre) & `categoryLuxSoft`
    - Tech : `categoryTech` (`#059669` clair / `#34D399` sombre) & `categoryTechSoft`
  - Sémantique : `success`, `successSoft`, `danger`, `dangerSoft`, `dangerBorder`, `warning`, `warningSoft`
- **Helpers & Design Tokens additionnels** :
  - `getThemeColors(mode: ThemeMode)` : retourne la palette complète (`lightColors` ou `darkColors`).
  - `getThemeGradient(mode: ThemeMode)` : retourne le tuple de 3 couleurs pour `expo-linear-gradient`.
  - `radii` (`sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `pill: 9999`), `spacing` (`xs: 4` à `xxl: 32`), `shadows` (`card`, `elevated`).

## testID
| testID | Élément | Écran / Composant |
|---|---|---|
| `theme-toggle-btn` | Bouton de bascule du thème Clair / Sombre | `Header.tsx` |
| `nav-settings-btn` | Bouton d'accès à la vue Paramètres | `Header.tsx` |
| `nav-home-btn` | Bouton de retour à la vue Veille (logo/titre Veyl et bouton retour) | `Header.tsx` |
| `generate-digest-btn` | Bouton « Générer la veille du jour » | `DigestDashboard.tsx` |
| `tab-ia` | Onglet catégorie « Intelligence Artificielle » | `DigestDashboard.tsx` |
| `tab-lux` | Onglet catégorie « Marché IT Luxembourg » | `DigestDashboard.tsx` |
| `tab-tech` | Onglet catégorie « Tech & Hardware » | `DigestDashboard.tsx` |
| `sidebar-toggle-btn` | Bouton d'ouverture/fermeture du panneau latéral d'historique (desktop) | `DigestDashboard.tsx` |
| `mobile-history-trigger` | Bouton accordéon d'ouverture/fermeture de l'historique (mobile `< 768px`) | `DigestDashboard.tsx` |
| `history-date-<dateStr>` | Bouton de sélection d'une date dans l'historique (ex. `history-date-2026-04-15`) | `DigestDashboard.tsx` |
| `go-further-btn-<idx>` | Bouton étincelle « Aller plus loin » sur l'élément d'actualité d'index `<idx>` (commence à `0` : `go-further-btn-0`, `go-further-btn-1`, …) | `ExpandableNewsSection.tsx` |
| `expanded-details-card` | Carte conteneur affichant le résultat ou l'état de l'approfondissement IA | `ExpandableNewsSection.tsx` |
| `expanded-details-close-btn` | Bouton « Fermer » de la carte d'approfondissement IA | `ExpandableNewsSection.tsx` |
| `prompt-ia-input` | Champ texte multiligne du prompt Gemini pour la catégorie IA | `SettingsView.tsx` |
| `prompt-lux-input` | Champ texte multiligne du prompt Gemini pour la catégorie Luxembourg | `SettingsView.tsx` |
| `prompt-tech-input` | Champ texte multiligne du prompt Gemini pour la catégorie Tech | `SettingsView.tsx` |
| `save-settings-btn` | Bouton « Sauvegarder les instructions » | `SettingsView.tsx` |
| `source-name-input` | Champ texte « Nom du site » pour l'ajout d'une source RSS | `SettingsView.tsx` |
| `source-url-input` | Champ texte « URL du flux RSS » pour l'ajout d'une source RSS | `SettingsView.tsx` |
| `source-category-select` | Sélecteur de catégorie (`IA`, `Luxembourg`, `Tech`) pour une nouvelle source | `SettingsView.tsx` |
| `add-source-btn` | Bouton « Ajouter » pour créer une nouvelle source RSS | `SettingsView.tsx` |
| `toggle-source-<id>` | Bouton de bascule `Actif` / `En pause` pour la source d'identifiant `<id>` | `SettingsView.tsx` |
| `delete-source-<id>` | Bouton « Supprimer » pour la source d'identifiant `<id>` | `SettingsView.tsx` |
| `empty-state` | Conteneur d'état vide (aucune synthèse pour la date/catégorie sélectionnée) | `DigestDashboard.tsx` |
| `error-banner` | Bannière d'alerte en cas d'erreur API ou de validation | `DigestDashboard.tsx` / `SettingsView.tsx` |

## Responsive
- **Mobile (`width < 768px`, ex. `375x812`)** :
  - Détection dynamique via `const { width } = useWindowDimensions(); const isMobile = width < 768;`.
  - La colonne d'historique s'affiche en haut en pleine largeur : le bouton `generate-digest-btn` occupe toute la largeur, suivi du bouton accordéon `mobile-history-trigger` qui affiche la date active et déplie/replie la liste des dates (`history-date-<dateStr>`). Le clic sur une date referme automatiquement l'accordéon.
  - Le bouton `sidebar-toggle-btn` est masqué sur mobile.
  - Les onglets `tab-ia`, `tab-lux`, `tab-tech` s'adaptent sur 2 lignes ou en barre compacte tactile (hauteur minimale `44px`).
  - Dans `SettingsView`, les champs d'ajout de source (`source-name-input`, `source-url-input`, `source-category-select`, `add-source-btn`) et les cartes de sources s'empilent verticalement (`flexDirection: 'column'`).
- **Desktop (`width >= 768px`, ex. `1440x900`)** :
  - Disposition horizontale (`flexDirection: 'row'`) dans `DigestDashboard`.
  - Barre latérale gauche fixe (`width: 272`) repliable via `sidebar-toggle-btn` ; la liste des dates est directement visible sans accordéon (`mobile-history-trigger` masqué).
  - Barre d'onglets sur une seule ligne à côté de `sidebar-toggle-btn`.
  - Formulaire d'ajout de source RSS aligné en ligne (`flexDirection: 'row'`) dans un conteneur centré (`maxWidth: 960`).

## Points ouverts pour le builder
- **Indexation déterministe de `go-further-btn-<idx>`** : dans `DigestDashboard.tsx` / `ExpandableNewsSection.tsx`, maintenir un compteur séquentiel d'items actionnables par synthèse affichée (commençant à `0`) afin que le premier bouton « Aller plus loin » visible dans l'onglet actif porte toujours `testID="go-further-btn-0"`, conformément à `AC-04`.
- **Sélecteur `source-category-select` compatible Web & Tests E2E** : s'assurer que `testID="source-category-select"` supporte à la fois la sélection par clic/changement de valeur dans Playwright et le rendu React Native Web.
- **Découplage strict Client / Serveur** : aucun composant dans `src/components/` ni `App.tsx` ne doit importer `@prisma/client`, `rss-parser` ou `@google/genai` ; toutes les lectures/écritures passent par `src/storage/*Repository.ts` et `src/services/aiService.ts`.
