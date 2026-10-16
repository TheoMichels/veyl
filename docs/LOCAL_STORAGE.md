# Lancer Veyl en local

```sh
npm install
npm run web
```

Ouvrir `http://localhost:8081` : l'application est accessible immédiatement, sans compte ni clés Supabase. Le badge « Stockage local » dans l'en-tête indique ce mode. Les synthèses quotidiennes (`digests`), flux RSS (`sources`) et réglages de prompts (`settings`) sont enregistrés dans le navigateur par les repositories AsyncStorage sous les clés `@veyl_sources_v1`, `@veyl_digests_v1` et `@veyl_settings_v1`.

Le stockage est propre à l'origine (protocole, hôte et port), au navigateur et au profil. Conserver la même adresse et le port 8081 pour retrouver ses données.

Pour inspecter ou supprimer ces données :
- Outils de développement du navigateur → Application / Stockage → Stockage local / IndexedDB de l'origine → clés `@veyl_*`.
- Effacer le stockage du site réinitialise l'application avec les sources et synthèses par défaut.

Pour prévisualiser l'export statique :
```sh
npm run build
npm run preview
```
(`http://localhost:4173`). Cette origine a son propre stockage indépendant du serveur de développement.

# Vercel et mode cloud

Le build `npm run build` sélectionne le mode Supabase uniquement lorsque Vercel fournit `VERCEL=1` (hors `VERCEL_ENV=development`). L'export hors Vercel et toute exécution sur une origine loopback (`localhost`, `127.0.0.1`, `::1`) restent en mode local garanti.

# Validation Zod

Toutes les données lues depuis le stockage local ou les API distantes sont systématiquement validées par Zod (`src/utils/validation.ts` et `src/storage/validatedStorage.ts`). Tout contenu JSON altéré ou non conforme lève une erreur explicite sans corrompre les données existantes.
