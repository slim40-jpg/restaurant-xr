# ADR-0001 — Modularisation de `main.js`

- **Statut** : Accepté
- **Date** : 2026-11-10
- **Décideurs** : Slim Selmi, Hazem Bellili, Wassim Hajji
- **Jalon** : W1

---

## Contexte

Le prototype tenait dans un unique fichier `main.js` de 332 lignes, organisé en
neuf sections commentées (`// ========== 1. SCÈNE ==========`), toutes déclarées
dans la portée du module. Conséquences observées :

- impossible de tester une règle métier sans instancier un renderer WebGL ;
- couplage fort entre construction du décor, configuration du renderer et logique
  de sélection ;
- revue de code impossible (un diff touche toujours le même fichier) ;
- travail à trois impossible sans conflits Git permanents ;
- remarque explicite de l'enseignant : *« Structurer votre code »*.

## Décision

Découper `main.js` en dix modules à responsabilité unique, répartis en cinq
dossiers (`config`, `core`, `world`, `xr`, `interaction`, `ui`), avec :

1. `main.js` réduit au câblage (≤ 60 lignes, aucune règle métier) ;
2. une règle de dépendance stricte et acyclique (voir `docs/ARCHITECTURE.md` §2) ;
3. les valeurs numériques et libellés centralisés dans `config/constants.js` ;
4. le mobilier exposé comme **fabriques** (`createTable`, `createChair`) et non
   comme code exécuté au chargement du module ;
5. l'interface de statut isolée derrière un contrat (`showTable`, `showReserved`,
   `showNoTarget`, `setMessage`) indépendant du DOM, pour permettre un passage
   au panneau 3D en W4 sans toucher à l'interaction.

## Alternatives écartées

| Alternative | Raison du rejet |
| --- | --- |
| Conserver un fichier unique mieux commenté | Ne règle ni les conflits Git à trois, ni la testabilité, ni la remarque du jury |
| Adopter un framework (React Three Fiber, A-Frame, Babylon.js) | Réécriture complète, perte du travail WebXR existant, valeur pédagogique inverse (on masquerait la WebXR API derrière une abstraction) |
| Découper en classes avec héritage (`Restaurant extends Scene`) | Sur-ingénierie pour un décor statique ; les fabriques suffisent et restent testables |
| Migrer vers TypeScript immédiatement | Ajouterait une étape de build au moment où l'objectif est de stabiliser la structure ; envisageable après W3 |

## Conséquences

**Positives**

- Chaque membre possède un périmètre d'écriture disjoint (`CODEOWNERS`).
- Une règle métier devient testable sans navigateur.
- Les revues portent sur des diffs de 30 à 80 lignes.
- Ajouter une table = ajouter une entrée dans `TABLE_LAYOUT`.

**Négatives / coûts**

- Dix fichiers à ouvrir pour comprendre un flux (atténué par `ARCHITECTURE.md` §3).
- Risque de sur-découpage : `core/scene.js` reste volontairement petit.
- L'ordre d'initialisation devient implicite : il est désormais documenté dans
  `ARCHITECTURE.md` §3.1 et centralisé dans `main.js`.

**Neutre**

- Aucun changement de comportement fonctionnel : la recette manuelle de
  `technical_specs.md` §10 donne le même résultat avant et après.

## Vérification

- `npm run check:headers` : 10/10 fichiers conformes.
- `npm run lint` : 0 erreur.
- `main.js` : moins de 60 lignes, aucun `if` portant sur un statut de table.
