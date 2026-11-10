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
          ├──> core/renderer ─────> three
          ├──> core/scene ────────> three, config
          ├──> world/restaurant ──> world/environment, world/furniture, config
          ├──> xr/controllers ────> three, three/addons
          ├──> interaction/selection ──> three, config
          └──> ui/status-panel ───> config
```

Le graphe est acyclique. `config/constants.js` est une feuille : elle n'importe
rien, ce qui la rend testable et sans effet de bord.

---

## 3. Flux d'exécution

### 3.1 Amorçage

```
main.js
  1. createRenderer()            → canvas ajouté au DOM, XR activé
  2. createScene()               → { scene, camera }
  3. addLighting(scene)          → ambiante + directionnelle + ponctuelle
  4. buildRestaurant()           → { restaurant, tablesGroup }
     scene.add(restaurant)
  5. setupControllers(renderer, scene) → { controller, grip }
  6. createStatusPanel(#status)
  7. controller.addEventListener('selectstart',
       createSelectionHandler({ tablesGroup, statusPanel }))
  8. renderer.setAnimationLoop(...) → boucle synchronisée casque
  9. window.addEventListener('resize', ...)
```

Aucune règle métier dans `main.js` : il ne connaît que des noms de fonctions.

### 3.2 Boucle de rendu

`renderer.setAnimationLoop(cb)` est utilisé et non `requestAnimationFrame` :
en session XR, la boucle doit être pilotée par `XRSession.requestAnimationFrame`,
sinon le rendu se désynchronise du casque et provoque un malaise. Cette contrainte
est structurelle, pas stylistique.

### 3.3 Sélection d'une table

```
selectstart (manette)
  → Matrix4 : extraction de la rotationworld du contrôleur
  → Raycaster : origine = position du contrôleur, direction = (0,0,-1)
  → intersectObjects(tablesGroup.children, recursive = true)
  → remontée de la hiérarchie jusqu'à userData.isTable
  → si status === 'available' :
        userData.status = 'reserved'
        userData.marker.material.color / emissive = jaune
        statusPanel.showReserved(table)
    sinon statusPanel.showTable(table)
  → si aucune intersection : statusPanel.showNoTarget()
```

Point de conception : la remontée de hiérarchie est nécessaire car le rayon touche
le plateau, le pied ou une chaise — jamais le `Group` de la table. Le marqueur est
référencé dans `userData` pour éviter de le retrouver par inspection de géométrie
(`geometry.type === 'CylinderGeometry'`), technique fragile qui cassait dès qu'un
meuble changeait de forme.

---

## 4. Points d'extension prévus

| Extension | Où intervenir | Sans toucher à |
| --- | --- | --- |
| Ajouter une table | `config/constants.js` → `TABLE_LAYOUT` | tout le reste |
| Ajouter un état de table | `constants.js` (couleur + libellé) puis `selection.js` | `world/**` |
| Nouvelle interaction (téléportation) | `xr/locomotion.js` + `interaction/teleport.js` | `world/**`, `ui/**` |
| Panneau de statut 3D | remplacer `ui/status-panel.js` par une implémentation `CanvasTexture` conservant la même interface | `interaction/**` |
| Persistance | ajouter `src/net/sync.js` consommant la même machine à états | `world/**`, `core/**` |

Le contrat d'interface de `ui/status-panel.js` (`showTable`, `showReserved`,
`showNoTarget`, `setMessage`) est volontairement indépendant du DOM : il permet
de basculer vers un panneau 3D en W4 sans modifier le module d'interaction.

---

## 5. Invariants d'architecture

1. `world/**` ne lit jamais le statut d'une table : il le reçoit en paramètre.
2. `interaction/**` est le seul endroit où une transition d'état est déclenchée.
3. `ui/**` ne contient aucune référence à Three.js.
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
| 0005 | WebGPURenderer et repli WebGL2 | Prévu W2 |
