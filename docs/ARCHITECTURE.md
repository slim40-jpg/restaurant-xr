# Architecture logicielle — Restaurant XR

| Version | 0.1.0 |
| --- | --- |
| Jalon | W1 |
| Date | 2026-11-10 |

Ce document décrit **comment** les modules s'articulent et **pourquoi** les
frontières ont été placées là. Les exigences sont dans
`docs/technical_specs.md` ; les décisions dans `docs/adr/`.

---

## 1. Vue en couches

```
┌──────────────────────────────────────────────────────────────┐
│  Amorçage            main.js                                 │
│  (câblage, boucle de rendu, redimensionnement)               │
└───────────────┬──────────────────────────────────────────────┘
                │ assemble
┌───────────────▼──────────┐   ┌──────────────────────────────┐
│  Monde 3D                │   │  Entrées / XR                │
│  world/environment.js    │   │  xr/controllers.js           │
│  world/furniture.js      │   │  interaction/selection.js    │
│  world/restaurant.js     │   │                              │
└───────────────┬──────────┘   └───────────────┬──────────────┘
                │ lit / mute l'état             │ produit des événements
┌───────────────▼───────────────────────────────▼──────────────┐
│  Présentation        ui/status-panel.js                       │
└───────────────┬──────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────┐
│  Socle technique     core/renderer.js · core/scene.js         │
│  Constantes          config/constants.js                      │
└──────────────────────────────────────────────────────────────┘
```

Règle de lecture : une flèche descendante est une dépendance autorisée ; une
flèche montante ne doit jamais exister.

---

## 2. Graphe de dépendances

```
main.js ──┬──> config/constants
          ├──> core/renderer ─────────> three/webgpu, three/addons
          ├──> core/scene ────────────> three, config
          ├──> world/restaurant ──────> world/{layout,environment,props,furniture}, config
          ├──> xr/controllers ────────> three, three/addons
          ├──> interaction/selection ─> three, config
          ├──> interaction/recommend ─> config
          ├──> interaction/highlight ─> three, config
          ├──> interaction/pointer ───> three
          ├──> interaction/controls ──> three/addons
          ├──> ui/preferences ────────> config, interaction/recommend
          ├──> ui/status-panel ───────> config
          ├──> ui/status-panel-3d ────> three, config
          ├──> ui/status-fanout
          └──> ui/backend-badge ──────> three/webgpu
```

Le graphe est acyclique. `config/constants.js` est une feuille : elle n'importe
rien, ce qui la rend testable et sans effet de bord. `ui/status-fanout.js` est le
seul module qui connaît plusieurs panneaux à la fois : il permet de publier un
même état sur le DOM (desktop) et sur le panneau 3D (VR) sans que
`interaction/**` sache combien de supports existent.

`world/layout.js` est une **donnée**, pas du code : il ne construit rien. C'est ce
qui permet à `interaction/recommend.js` de classer les tables sans jamais toucher
à Three.js, et à `tests/smoke.html` de vérifier le classement sans navigateur 3D.

---

## 3. Flux d'exécution

### 3.1 Amorçage

```
main.js
  1. createXRRenderer({ container })  → canvas monté, XR activé, repli WebGL2 armé
  2. createScene()                    → { scene, camera }
  3. addLighting(scene)               → ambiante + directionnelle + ponctuelle
  4. buildRestaurant()                → { restaurant, tablesGroup }
     scene.add(restaurant)
  5. createWorldStatusPanel()         → panneau 3D ajouté à la scène
     createStatusFanout([panneau DOM, panneau 3D])
  6. setupControllers(renderer, scene) → { controller, grip, button }
  7. createSelectionService(...)       → { select(ray) }
     controller.addEventListener('selectstart', createSelectionHandler(...))
     enablePointerSelection({ domElement, camera, select })
  8. createOrbitControls + bindControlsToXR
  9. xrRenderer.setAnimationLoop(...)  → boucle synchronisée casque
 10. window.addEventListener('resize', ...)
```

Aucune règle métier dans `main.js` : il ne connaît que des noms de fonctions.

### 3.2 Boucle de rendu

`renderer.setAnimationLoop(cb)` est utilisé et non `requestAnimationFrame` :
en session XR, la boucle doit être pilotée par `XRSession.requestAnimationFrame`,
sinon le rendu se désynchronise du casque et provoque un malaise. Cette contrainte
est structurelle, pas stylistique.

### 3.3 Sélection d'une table

```
source du rayon                      service commun
─────────────────                    ──────────────
selectstart (manette) ──┐
                        ├──> createSelectionService.select(ray)
clic souris (pointer) ──┘            │
                                     ├── intersectObjects(tablesGroup.children, true)
                                     ├── remontée de hiérarchie → userData.isTable
                                     ├── available → reserved + marqueur jaune
                                     └── statusPanel.* (fanout DOM + 3D)
```

Deux adaptateurs produisent un `THREE.Ray`, un seul service applique la règle
métier. Ajouter demain une source (manette gauche, regard, téléportation) ne
touche pas à la machine à états.

Point de conception : la remontée de hiérarchie est nécessaire car le rayon touche
le plateau, le pied ou une chaise — jamais le `Group` de la table. Le marqueur est
référencé dans `userData` pour éviter de le retrouver par inspection de géométrie
(`geometry.type === 'CylinderGeometry'`), technique fragile qui cassait dès qu'un
meuble changeait de forme.

---

## 4. Points d'extension prévus

| Extension | Où intervenir | Sans toucher à |
| --- | --- | --- |
| Ajouter une table | `world/layout.js` → `TABLE_CATALOGUE` (position, zone, capacité) | tout le reste |
| Ajouter une zone ou une caractéristique | `config/constants.js` (`ZONES`, `TABLE_FEATURES`, libellés) puis `world/layout.js` | `world/environment.js` |
| Ajouter un critère de recommandation | `interaction/recommend.js` (barème de score) | `world/**`, `ui/**` |
| Ajouter un état de table | `constants.js` (couleur + libellé) puis `selection.js` | `world/**` |
| Nouvelle interaction (téléportation) | `xr/locomotion.js` + `interaction/teleport.js` | `world/**`, `ui/**` |
| Panneau de statut 3D | **fait** : `ui/status-panel-3d.js` implémente le même contrat que le panneau DOM, diffusé par `ui/status-fanout.js` | `interaction/**` |
| Persistance | ajouter `src/net/sync.js` consommant la même machine à états | `world/**`, `core/**` |
| Nouveau backend de rendu | `core/renderer.js` uniquement (le reste ne connaît que `getRenderer()`) | `world/**`, `ui/**` |

Le contrat d'interface de `ui/status-panel.js` (`showTable`, `showReserved`,
`showNoTarget`, `setMessage`) est volontairement indépendant du DOM : il permet
de basculer vers un panneau 3D en W4 sans modifier le module d'interaction.

---

## 5. Invariants d'architecture

1. `world/**` ne lit jamais le statut d'une table : il le reçoit en paramètre.
2. `interaction/**` est le seul endroit où une transition d'état est déclenchée.
3. `ui/**` ne connaît que le contrat des panneaux et Three.js pour le rendu texte : il ne lit jamais l'état d'une table, il le reçoit.
4. `core/**` ignore l'existence des tables.
5. Aucun module hors `main.js` n'ajoute d'objet à la scène racine (sauf
   `xr/controllers.js`, qui gère son propre cycle de vie).
6. Une constante affichée à l'utilisateur n'est jamais dupliquée en dur.

---

## 6. Index des décisions d'architecture

| ADR | Sujet | Statut |
| --- | --- | --- |
| [0001](adr/0001-modularisation.md) | Modularisation de `main.js` | Accepté |
| [0002](adr/0002-strategie-documentation.md) | Séparation README / `docs/` | Accepté |
| 0003 | Téléportation (locomotion) | Prévu W4 |
| 0004 | Backend multi-utilisateur | Prévu W5 |
| 0005 | WebGPURenderer et repli WebGL2 | Accepté (voir `docs/MIGRATION_R160_R187.md`) |
