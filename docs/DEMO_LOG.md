# Journal de démonstration — Restaurant XR

Ce journal consigne, semaine par semaine, la **preuve vérifiable** de l'avancement :
ce qui a été livré, la commande exécutée, le résultat observé, et la plage de commits
correspondante. Objectif : permettre à un correcteur de contrôler cinq semaines de
travail en deux minutes, sans lire l'intégralité du code.

Règle : aucune ligne n'est ajoutée sans une commande et un résultat réels. Si une
vérification n'a pas été faite, elle est marquée `NON VÉRIFIÉ` avec la raison.

---

## Semaine 1 — Socle d'ingénierie logicielle

**Branche** : `chore/engineering-baseline` · **Date** : 2026-11-10

### Livré

| Élément | Détail |
| --- | --- |
| Code modulaire | `main.js` passe de 332 lignes à 41 ; 10 modules dans `config/`, `core/`, `world/`, `xr/`, `interaction/`, `ui/` |
| En-têtes réglementaires | `@file`, `@brief`, `@author`, `@date`, `@role` sur chaque module, vérifiés automatiquement |
| Outillage | ESLint (configuration plate, ES2022), Prettier, `.editorconfig`, vérificateur d'en-têtes sans dépendance |
| Documentation | `technical_specs.md`, `PLANNING.md`, `ARCHITECTURE.md`, 2 ADR, ce journal |
| README | Réécrit : il ne décrit plus que des fonctionnalités présentes dans le code |
| Hygiène du dépôt | `LICENSE` (MIT), `.gitignore`, `.gitattributes` (Git LFS), `CONTRIBUTING.md`, `CODEOWNERS` |
| Attribution | `ATTRIBUTION.md` corrigé, licences Sketchfab renseignées |
| Test | `tests/smoke.html` — 11 assertions dans un navigateur réel |

### Vérifié

```bash
$ npm run verify
PASS  src/config/constants.js (69 lignes)
PASS  src/core/renderer.js (23 lignes)
PASS  src/core/scene.js (51 lignes)
PASS  src/interaction/selection.js (61 lignes)
PASS  src/main.js (41 lignes)
PASS  src/ui/status-panel.js (60 lignes)
PASS  src/world/environment.js (134 lignes)
PASS  src/world/furniture.js (105 lignes)
PASS  src/world/restaurant.js (31 lignes)
PASS  src/xr/controllers.js (43 lignes)
10/10 fichier(s) conforme(s).

> eslint .
(0 erreur)

> prettier --check "src/**/*.js" "scripts/**/*.mjs" "*.html"
All matched files use Prettier code style!
```

**Exécution réelle de l'application** — navigateur headless, page servie en HTTP :

```bash
$ msedge --headless=new --dump-dom http://127.0.0.1:8125/
<canvas data-engine="three.js r160" width="754" height="487" ...></canvas>
<button id="VRButton" ...>VR NOT SUPPORTED</button>
```

Interprétation : `main.js` s'exécute jusqu'au bout (canvas monté, bouton VR injecté).
`VR NOT SUPPORTED` est attendu en headless, où `navigator.xr` n'existe pas.

**Test fonctionnel** — `tests/smoke.html` : **11/11 assertions réussies**, dont :

```
PASS | réservation appliquée [reserved]
PASS | marqueur recoloré en jaune [0xcccc00]
PASS | texte du panneau [Table sélectionnée : Table_-3_-3 — Disponible → Réservée !]
PASS | couleur verte du panneau [rgb(0, 255, 0)]
PASS | seconde visée sur table réservée [Table sélectionnée : Table_-3_-3 — Réservée]
PASS | message hors cible [Aucune table visée]
```

Les neuf autres assertions couvrent le nombre de tables, les `userData`, l'état
initial des six tables et la composition du groupe `restaurant`.

**Disponibilité des ressources** : les douze fichiers servis en HTTP renvoient `200`,
et les trois cibles de l'import map (`three@0.160.0`, `VRButton.js`,
`XRControllerModelFactory.js`) renvoient `200`.

### NON VÉRIFIÉ (assumé, avec raison)

- **Rendu visuel et session immersive sur casque** : aucun casque connecté à la
  machine de développement au moment du jalon. La parité visuelle repose sur la
  revue module par module (géométries, matériaux, positions inchangés) et sur la
  recette de `technical_specs.md` §10, à rejouer avant la démonstration.
- **WebXR** : le bouton affiche `VR NOT SUPPORTED` en headless ; la session
  `immersive-vr` n'a donc pas été ouverte dans ce test.

### Commits

```
28e2aaa chore(tooling): ajouter ESLint, Prettier et un vérificateur d'en-têtes
db6a762 refactor(src): découper main.js en dix modules à responsabilité unique
deae42f test(smoke): ajouter un test fonctionnel navigateur de la sélection
7d87b30 docs(specs): extraire la documentation technique vers docs/
ee5ee59 docs(planning): publier le planning W1-W5 et la feuille de route
a87ebe2 docs(readme): réécrire le README pour refléter le code réel
69c28dc chore(repo): ajouter la licence MIT et la configuration Git
c82468f docs(attribution): corriger les déclarations et renseigner les licences
```

### Réponse point par point aux remarques du jury

| Remarque | Traitement | Preuve |
| --- | --- | --- |
| « Structurer votre code » | Découpage en 10 modules, `main.js` à 41 lignes | `src/`, ADR-0001, `npm run verify` |
| « Dossier `/docs` absent » | `technical_specs.md` + `PLANNING.md` + `ARCHITECTURE.md` + 2 ADR | `docs/` |
| « En-têtes et blocs de commentaires manquants » | En-tête obligatoire par fichier, JSDoc sur chaque export | `npm run check:headers` → 10/10 |
| « 5 commits seulement » | 8 commits sur une branche dédiée, un par préoccupation | `git log` ci-dessus |
| « Version obsolète de Three.js » | Pris en compte, planifié | `docs/PLANNING.md` W2 |
| « Pas de PWA » | Pris en compte, planifié | `docs/PLANNING.md` W3 |

### Prochaine étape

Jalon **W2** : migration vers `three@0.187.0` avec `WebGPURenderer` et repli
`WebGLXRFallback`, badge de backend, et `docs/MIGRATION_R160_R187.md`.

---

## Modèle pour les semaines suivantes

````markdown
## Semaine N — <thème>

**Branche** : <nom> · **Date** : AAAA-MM-JJ

### Livré
<ce qui a changé, avec les fichiers concernés>

### Vérifié
```bash
$ <commande>
<résultat réel, copié tel quel>
```

### NON VÉRIFIÉ
<ce qui n'a pas pu être vérifié, et pourquoi>

### Commits
<git log --oneline — plage de hachages>

### Prochaine étape
<le prochain livrable>
````
