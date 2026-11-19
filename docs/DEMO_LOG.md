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
| Code modulaire | `main.mjs` passe de 332 lignes à 41 ; 10 modules dans `config/`, `core/`, `world/`, `xr/`, `interaction/`, `ui/` |
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

Interprétation : `main.mjs` s'exécute jusqu'au bout (canvas monté, bouton VR injecté).
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
| « Structurer votre code » | Découpage en 10 modules, `main.mjs` à 41 lignes | `src/`, ADR-0001, `npm run verify` |
| « Dossier `/docs` absent » | `technical_specs.md` + `PLANNING.md` + `ARCHITECTURE.md` + 2 ADR | `docs/` |
| « En-têtes et blocs de commentaires manquants » | En-tête obligatoire par fichier, JSDoc sur chaque export | `npm run check:headers` → 10/10 |
| « 5 commits seulement » | 8 commits sur une branche dédiée, un par préoccupation | `git log` ci-dessus |
| « Version obsolète de Three.js » | Pris en compte, planifié | `docs/PLANNING.md` W2 |
| « Pas de PWA » | Pris en compte, planifié | `docs/PLANNING.md` W3 |

### Prochaine étape

Jalon **W2** : migration vers `three@0.187.0` avec `WebGPURenderer` et repli
`WebGLXRFallback`, badge de backend, et `docs/MIGRATION_R160_R187.md`.

---

## Semaine 2 — Rendu moderne et démonstration utilisable

**Branche** : `feat/three-r187` · **Date** : 2026-11-11

### Livré

| Élément | Détail |
| --- | --- |
| Three.js r187 | `WebGPURenderer` (`three/webgpu`), import map alignée, plus aucun `WebGLRenderer` |
| Repli WebGL2 | `setupWebGLXRFallback` installé : la session XR ne peut plus se retrouver sur un backend incompatible |
| Badge de backend | `WebGPU · actif` / `WebGL 2 · repli`, visible en permanence, avec la révision de Three.js |
| Sélection à la souris | clic = réservation, glisser = orbite (seuil 6 px / 400 ms), `dispose()` propre |
| Caméra desktop | `OrbitControls` bornés (1,5–9 m, jamais sous le sol), coupés pendant une session XR |
| Panneau d'état 3D | `CanvasTexture` ancré dans la salle, orienté vers la caméra → le retour est enfin lisible **dans** le casque (DT-03) |
| Diffusion d'état | `ui/status-fanout.mjs` publie le même état sur le panneau DOM et le panneau 3D |
| Capture de référence | `docs/img/w2-application.png` (1280 × 800, rendu réel) |

### Vérifié

```bash
$ npm run verify
15/15 fichier(s) conforme(s).
All matched files use Prettier code style!
(eslint : 0 erreur)
```

**Application réelle**, page servie en HTTP, Edge headless :

```
canvas data-engine : three.js r187 webgpu
bouton VR          : <button id="VRButton">VR NOT SUPPORTED</button>
badge              : WebGL 2 · repli · three r187
```

`VR NOT SUPPORTED` et le repli WebGL2 sont **attendus** : la machine de test n'a ni
casque ni adaptateur GPU exposé (`"No available adapters."`). Le chemin WebGPU est
néanmoins instancié, et Three.js bascule seul sur WebGL2 — c'est précisément la
preuve que le repli fonctionne. Sur un poste avec GPU, le badge affiche
`WebGPU · actif`.

**Test fonctionnel** — `tests/smoke.html` : **18/18 assertions réussies**, dont les
nouvelles :

```
PASS | panneau 3D = Mesh texturé
PASS | panneau 3D réellement dessiné [127509 px opaques]
PASS | panneau 3D orientable vers la caméra
PASS | fanout diffuse à tous les panneaux [1/1]
PASS | clic souris déclenche une sélection [1]
PASS | glisser de caméra ne sélectionne pas [1]
PASS | dispose retire les écouteurs [1]
```

**Contrôle visuel** (capture analysée indépendamment) : scène non noire, 6 tables,
6 marqueurs (3 verts, 1 rouge, 1 jaune, 1 gris), 2 lampes suspendues visibles,
panneau du fond lisible, badge présent, aucun artefact de rendu ni géométrie
flottante.

### NON VÉRIFIÉ

- **Session immersive réelle** : aucun casque connecté. Le comportement du repli
  XR au moment de `setSession` est donc vérifié par lecture du code de l'addon et
  par la documentation, pas par une exécution sur casque.
- **Rendu WebGPU natif** : pas d'adaptateur GPU disponible en headless ; seul le
  chemin de repli a été exercé.
- **Réétalonnage esthétique** après r181/r165 : les intensités lumineuses sont
  inchangées, un ajustement reste possible.

### Commits

```
26724dd chore(render): migrer vers three r187 avec WebGPURenderer et repli WebGL2
55a0f39 feat(input): selectionner une table a la souris et piloter la camera
b3c9506 feat(ui): afficher l etat de reservation dans le casque
e1cdeac feat(app): cabler la selection souris et le panneau 3D au bootstrap
aa0cc0c test(smoke): couvrir le panneau 3D, le fanout et le clic souris
a1bc899 docs(w2): documenter la migration r187, les nouveaux modules et les preuves
```

### Réponse point par point aux remarques du jury

| Remarque | Traitement | Preuve |
| --- | --- | --- |
| « Three.js r160 obsolète, bloque WebGPU » | r187 + `WebGPURenderer` + repli WebGL2 | badge à l'écran, `docs/MIGRATION_R160_R187.md` |
| « Pas de PWA » | Prévu W3 | `docs/PLANNING.md` |
| « Peu de commits » | 6 commits de plus, un par préoccupation | `git log` ci-dessus |
| « Structurer le code » | 15 modules, chacun ≤ 200 lignes | `npm run check:headers` → 15/15 |
| « En-têtes et commentaires » | en-tête + JSDoc sur chaque export | `npm run check:headers` |
| « Dossier /docs » | 6 documents + 2 ADR + migration + journal | `docs/` |

### Prochaine étape

Jalon **W3** : PWA (manifeste, service worker, icônes), déploiement HTTPS et audit
Lighthouse. La téléportation et les modèles GLB restent en W4.

---

## Semaine 3 — Salle réaliste et choix de place

**Branche** : `feat/salle-realiste` · **Date** : 2026-11-11

### Livré

| Élément | Détail |
| --- | --- |
| Plan de salle | 22 × 14 m, **16 tables** `T01`…`T16`, capacités 2/4/6, formes rondes et rectangulaires |
| Zones | 5 zones : `window` (5), `corner` (3), `banquette` (3), `center` (3), `bar` (2) |
| Caractéristiques | `quiet`, `private`, `view`, `near_wc`, `near_entrance` — cumulables, portées par la donnée |
| Décor | baie vitrée, bar et tabourets, banquettes capitonnées, portes **CUISINE** et **WC** signalées, plantes, lampes, poutres et gaines, ardoise de menu |
| Vaisselle | 54 couverts (assiettes, verres, serviettes), 6 chevalets de menu, 6 bougeoirs |
| Choix de place | moteur de score pur (zone, couverts, calme, éloignement WC), panneau de préférences accessible, mise en évidence dorée des tables proposées |
| Identifiants | stables `T01`…`T16` — la clé primaire du backend est désormais utilisable (DT-05 levée) |
| Rendu | canvas dimensionné par le conteneur (`ResizeObserver`), plus de bandes noires quand la fenêtre change |

### Vérifié

```bash
$ npm run verify
21/21 fichier(s) conforme(s).   (en-têtes, limite de 200 lignes, ESLint, Prettier)

$ tests/smoke.html (navigateur réel, HTTP)
26/26 assertions réussies.
```

Dont : 16 tables construites · identifiants `T01..T16` uniques · chaque table porte zone,
capacité et caractéristiques · répartition des statuts `available 12 / occupied 2 /
reserved 1 / unavailable 1` · réservation effective sur T01 · classement déterministe ·
zone `window` prioritaire · `reasons` uniquement en libellés français.

```bash
$ msedge --headless --screenshot=docs/img/w3-salle.png
canvas data-engine : three.js r187 webgpu
badge              : WebGL 2 · repli · three r187   (attendu : pas d'adaptateur GPU en headless)
```

### Revue visuelle indépendante

La capture a été analysée par un agent d'analyse d'image, en deux passes, sur des critères
explicites (lisibilité du restaurant, cadrage, artefacts, collisions).

| Passe | Note | Constat |
| --- | --- | --- |
| 1 (salle initiale) | 6/10 | bandes noires, 66 % de cadre vide, plafond nu, mur du bar vide, aucun couvert |
| 2 (après vaisselle et plafond) | 6,5/10 | bandes noires corrigées, cadre mort réduit à ~30 %, vaisselle lisible |
| 3 (après HUD, éclairage, préférences) | — | panneau 3D masqué hors VR, halo de plafond atténué, plus d'allumage au chargement |

**Défauts restants, assumés et documentés** :

- traînées de lumière diagonales sur les murs du fond et de droite (ombres de la lumière
  de baie sur une boîte d'ombre large) — esthétique, pas bloquant ;
- bande sombre en haut de cadre (plafond en incidence rasante) ;
- le comptoir du bar reste hors champ au cadrage par défaut : il faut orbiter pour le voir ;
- le panneau de préférences n'existe qu'en DOM, donc **hors session immersive** — sa
  traduction en panneau 3D est planifiée avec la téléportation (W4).

### Commits

```
2a706a9 feat(world): plan de salle realiste de 16 tables et decor de bistrot
0ba5c16 feat(ui): choisir une place par preference plutot qu une table libre
93c8a4c feat(app): cabler les preferences et corriger le dimensionnement du canvas
05189ff test(smoke): adapter les assertions aux 16 tables et au moteur de preferences
```

### Prochaine étape

Reprendre le programme du jalon **W3** : manifeste PWA, service worker, déploiement
HTTPS. La salle réaliste et le choix de place sont livrés en avance sur W4.

---

## Semaine 4 — Le lieu réel : étage, jardin, marche et menu

**Branche** : `feat/lieu-reel` · **Date** : 2026-11-17

### Livré

| Élément | Détail |
| --- | --- |
| Bâtiment | Hauteur 6,30 m : rez 0 → 3,00, dalle, **mezzanine 3,25 → 6,30** sur la moitié arrière |
| Escalier | 14 marches, 1,20 m de large, axe x = −7,0, z de −1,0 à +3,2, garde-corps et main courante |
| Jardin | Terrasse bois z ∈ [7,2 ; 16], pergola, guirlandes émissives, haies, 4 tables |
| Tables | **24** : 16 au rez, 4 en mezzanine (T21–T24), 4 en terrasse (T17–T20), toutes avec `level` |
| Marche | Caméra à hauteur d'yeux, ZQSD/WASD, souris (pointer lock), collision murs/bar/garde-corps, montée d'escalier lissée, bascule `V` |
| Fiche table | Clic = fiche + **menu de 16 plats** ; la réservation passe par un bouton explicite |
| Surfaces | `walkable.mjs` : surfaces praticables + colliders, testables sans Three.js |

### Vérifié

```bash
$ npm run verify
36/36 fichier(s) conforme(s).
All matched files use Prettier code style!
(eslint : aucune erreur)

$ tests/smoke.html
29/29 assertions réussies.
```

Dont les nouvelles : 24 tables · identifiants `T01..T24` uniques · chaque table porte
zone, capacité, caractéristiques **et niveau** · **la sélection ne réserve pas** ·
`onSelect` transmet la table visée · `reserve()` applique la transition · `reserve()`
refuse une table déjà réservée · la manette ne réserve pas non plus.

**Logique de marche, testée sous Node** (valeurs réelles) :

```
avance libre 1 s            → x = 2,800 m
mur à 1 m, poussée de 2 m   → x = 0,720 m  (marge = rayon 0,280) — jamais traversé
glissement le long du mur   → x bloqué, z = 1,808 m parcouru
surface absente             → déplacement annulé
rampe d'escalier            → y = 2,979 m après 1 s (lissage dt × 12)
pitch extrême               → 1,396 rad = 80° (écrêtage exact)
```

**Application**, page servie en HTTP :

```
canvas        : three.js r187 webgpu
view-toggle   : présent, bouton « Marcher » rendu
table-card    : conteneur présent
écran WebGPU  : non affiché
```

### NON VÉRIFIÉ

- **Capture du nouveau lieu** : impossible en headless, `WebGPURenderer` n'obtient pas
  d'adaptateur (le rendu ne produit aucune frame). À refaire sur une machine avec GPU.
  La capture du README reste celle du jalon W3, avec une légende explicite.
- **Pointer lock en conditions réelles** : le test navigateur automatisé ne peut pas
  verrouiller le pointeur.
- **Montée d'escalier à l'écran** : validée par la logique pure, pas visuellement.

### Commits

```
f5c6731 feat(world): batiment a deux niveaux, escalier et jardin-terrasse
290cabc feat(ui): fiche de table avec menu et reservation explicite
e993a2d feat(interaction): marcher dans le restaurant a hauteur d yeux
4dafe04 feat(app): cabler la marche, la fiche table et les trois niveaux
```

### Prochaine étape

**W5** : PWA (manifeste, service worker, hors-ligne) — seule remarque du jury encore
ouverte — puis téléportation VR. Le backend suit en W6/W7.

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
