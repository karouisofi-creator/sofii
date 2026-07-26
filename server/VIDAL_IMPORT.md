# Import Vidal - Guide rapide

Place ici tes fichiers Vidal (CSV, XLSX, JSON). Le projet inclut un script utilitaire pour fusionner plusieurs fichiers en un seul CSV "merged" que l'API peut charger.

1. Ajouter les fichiers

- Copier tes fichiers dans `server/data/vidal/`.

2. Fusionner les fichiers en un seul CSV

```bash
cd server
node scripts/merge-vidal.js ../data/vidal ../data/knowledge_vidal_merged.csv
```

- Le script lit les fichiers `.csv`, `.xlsx` et `.json` du dossier d'entrée.
- Il tente d'extraire les colonnes les plus courantes (`Name`, `GenericName`, `Indications`, `SideEffects`, `Contraindications`, `Dosage`, `Route`, `References`, `Notes`).
- Il déduplique sur `Name` / `GenericName`.

3. Charger dans l'API

- Placer `knowledge_vidal_merged.csv` dans `server/data/` (le script le place déjà si tu utilises le chemin d'exemple).
- Redémarrer le serveur si nécessaire :

```bash
npm run dev
# ou
npm start
```

4. Générer des alias de médicaments (optionnel)

- Le fichier `server/scripts/generate-aliases.js` peut lire un CSV fusionné et proposer un fichier `server/routes/med_aliases.json` avec les variantes normalisées (sans accents, minuscules, suppression d'espaces/puces, etc.).

5. Conseils

- Vérifie que la colonne `Name` ou `GenericName` existe, sinon le routeur ne considérera pas la table comme "medications".
- Si tu veux que j'automatise l'écriture de `MEDICATION_ALIASES` dans `server/routes/chat-integrated.js`, je peux le faire en ajoutant une importation dynamique du JSON d'alias.

---

Si tu veux, fournis un petit fichier Vidal (1-5 lignes) et je le fusionne et montre le résultat. Ou je peux exécuter la génération d'alias maintenant et injecter les alias dans le routeur si tu valides.
