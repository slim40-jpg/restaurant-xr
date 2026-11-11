# Spécifications techniques — Restaurant XR

| Champ | Valeur |
| --- | --- |
| Projet | Restaurant XR — plateforme immersive de réservation |
| Version du document | 0.1.0 |
| Jalon | W1 — Socle d'ingénierie logicielle |
| Date | 2026-11-10 |
| Équipe | Slim Selmi · Hazem Bellili · Wassim Hajji |
| Établissement | SUP'COM — Extended Reality (2026–2027) |

---

## 1. Objet

Ce document constitue la référence technique du projet : périmètre, exigences,
architecture modulaire, modèle de données, machine à états, APIs navigateur
sollicitées, conventions de développement et dette technique assumée.

Il ne remplace pas le `README.md` (prise en main rapide) ni `docs/PLANNING.md`
(feuille de route). Toute décision d'architecture structurante est tracée dans
`docs/adr/`.

---

## 2. Périmètre

### 2.1 Inclus (MUST)

| ID | Exigence | État |
| --- | --- | --- |
| MUST-01 | Scène 3D d'un restaurant (sol, murs, plafond, 6 tables, chaises, éclairage) | ✅ |
| MUST-02 | Session immersive `immersive-vr` via WebXR dans un navigateur standard | ✅ |
| MUST-03 | Rendu des manettes VR (modèle 3D chargé depuis les profils d'entrée) | ✅ |
| MUST-04 | Sélection d'une table par raycasting depuis la manette | ✅ |
| MUST-05 | Affichage de l'état d'une table (disponible / occupée / réservée / indisponible) | ✅ |
| MUST-06 | Réservation d'une table disponible (transition d'état visible) | ✅ |
| MUST-07 | Aucune installation native : ES Modules + import map, sans étape de build | ✅ |

### 2.2 Souhaité (SHOULD)

| ID | Exigence | Jalon |
| --- | --- | --- |
| SHOULD-01 | Three.js r187+ avec `WebGPURenderer` et repli WebGL2 | W2 |
| SHOULD-02 | Application installable (PWA) avec fonctionnement hors-ligne | W3 |
| SHOULD-03 | Téléportation au joystick avec retour visuel | W4 |
| SHOULD-04 | Persistance des réservations et synchronisation multi-utilisateur | W5 |
| SHOULD-05 | Interface de statut lisible **à l'intérieur** du casque | W4 |
| SHOULD-06 | Intégration des modèles GLB du dossier `assets/` | W4 |

### 2.3 Hors périmètre (WON'T)

- Paiement en ligne et gestion de facturation.
- Authentification multi-rôles complète (client / administrateur / serveur).
- Application native Android / iOS / Unity.
- Reconnaissance des mains sans manettes (reportée après le cours).
- Backend de production scalable (le jalon W5 vise un backend de démonstration).

Toute demande sortant de ce périmètre est enregistrée dans la section 9 du
`docs/PLANNING.md` et arbitrée avant implémentation.

---

## 3. Exigences non fonctionnelles

| ID | Exigence | Critère mesurable |
| --- | --- | --- |
| NFR-01 | Fluidité | Boucle de rendu pilotée par `renderer.setAnimationLoop` (synchronisée casque, 72/90 Hz) — jamais `requestAnimationFrame` en session XR |
| NFR-02 | Compatibilité | Chrome 79+, Edge 79+, Meta Quest Browser ; repli écran (souris) si WebXR indisponible |
| NFR-03 | Contexte sécurisé | Servi en `https://` ou `http://localhost` — WebXR refuse `file://` |
| NFR-04 | Maintenabilité | Aucun fichier > 200 lignes, un module = une responsabilité, en-tête + JSDoc obligatoires |
| NFR-05 | Qualité vérifiable | `npm run verify` (en-têtes + ESLint + Prettier) sans erreur avant chaque PR |
| NFR-06 | Traçabilité | Commits conventionnels, une branche par jalon, une Pull Request par jalon |

---

## 4. Architecture modulaire

```
src/
├── main.js                     # Amorçage : assemble les modules, aucune logique métier
├── config/
│   └── constants.js            # Constantes : couleurs, dimensions, statuts, plan des tables
├── core/
│   ├── renderer.js             # WebGPURenderer + repli WebGL2 (session XR comprise)
│   └── scene.js                # Scène, caméra, éclairage
├── world/
│   ├── environment.js          # Sol, murs, plafond, tapis, tableaux, lampes
│   ├── furniture.js            # Fabrique de chaises et de tables (+ marqueur d'état)
│   └── restaurant.js           # Composition du décor et des 6 tables
├── xr/
│   └── controllers.js          # Bouton VR, manette, modèle 3D du grip, rayon de visée
├── interaction/
│   ├── selection.js            # Service rayon → état + adaptateur manette
│   ├── pointer.js              # Adaptateur souris (clic → rayon monde)
│   └── controls.js             # OrbitControls bornés, coupés pendant une session XR
└── ui/
    ├── status-panel.js         # Panneau de statut HTML (desktop)
    ├── status-panel-3d.js      # Panneau de statut texturé, ancré dans la salle (VR)
    ├── status-fanout.js        # Diffusion d'un état vers plusieurs panneaux
    └── backend-badge.js        # Badge WebGPU / WebGL2
```

### 4.1 Responsabilités et dépendances

| Module | Responsabilité unique | Dépend de |
| --- | --- | --- |
| `config/constants.js` | Source de vérité des valeurs numériques et des libellés | — |
| `core/renderer.js` | Créer le renderer WebGPU et garantir le repli WebGL2 | `three/webgpu`, `three/addons` |
| `core/scene.js` | Créer scène + caméra, installer l'éclairage | `three`, `config` |
| `world/environment.js` | Construire le bâti (sol, murs, plafond, décor) | `three`, `config` |
| `world/furniture.js` | Fabriquer une table / une chaise isolée | `three`, `config` |
| `world/restaurant.js` | Composer environnement + mobilier | `environment`, `furniture`, `config` |
| `xr/controllers.js` | Exposer manette, grip et rayon de visée | `three`, `three/addons` |
| `interaction/selection.js` | Transformer un rayon en transition d'état | `three`, `config` |
| `interaction/pointer.js` | Traduire un clic souris en rayon monde | `three` |
| `interaction/controls.js` | Piloter la caméra hors session XR | `three/addons` |
| `ui/status-panel.js` | Afficher l'état dans le DOM | `config` |
| `ui/status-panel-3d.js` | Afficher l'état sur un plan texturé (VR) | `three`, `config` |
| `ui/status-fanout.js` | Diffuser un appel vers plusieurs panneaux | — |
| `ui/backend-badge.js` | Rendre visible le backend actif | `three/webgpu` |
| `main.js` | Câbler le tout, boucle de rendu, redimensionnement | tous |

### 4.2 Règles de dépendance

1. **Aucune dépendance circulaire.** Le graphe est un DAG orienté vers `config`.
2. `world/**` ne connaît ni la XR ni l'interface : il ne produit que des `Object3D`.
3. `interaction/**` ne crée jamais de géométrie ; il lit et mute l'état d'objets existants.
4. `ui/**` est le seul module autorisé à écrire du texte applicatif dans le DOM.
5. `main.js` ne contient aucune règle métier (aucun `if` sur un statut de table).
6. Aucun module n'importe `main.js`.

---

## 5. Modèle de données

### 5.1 Table (état runtime, client)

Chaque table est décrite dans `src/world/layout.js` (`TABLE_CATALOGUE`) puis
instanciée en `Object3D`. Les propriétés de choix d'une place sont **des données**,
pas du code : c'est ce qui permet de trier, filtrer et, plus tard, persister.

| Champ | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant **stable** `T01`…`T16`, indépendant de la position (clé primaire en W5) |
| `x`, `z` | `number` | Position du centre de la table, en mètres |
| `rotation` | `number` | Rotation autour de l'axe Y, en radians |
| `capacity` | `2 \| 4 \| 6` | Nombre de couverts |
| `shape` | `'round' \| 'rect'` | Forme du plateau |
| `zone` | `enum` | `window`, `corner`, `center`, `bar`, `banquette` — critère principal de choix |
| `features` | `string[]` | `quiet`, `private`, `view`, `near_wc`, `near_entrance` — cumulables |
| `status` | `enum` | `available`, `occupied`, `reserved`, `unavailable` |
| `isTable` | `boolean` | Marqueur utilisé par la remontée de hiérarchie au raycasting |
| `marker` | `THREE.Mesh` | Cylindre coloré au-dessus du plateau, recoloré lors d'un changement d'état |

Le statut et les attributs sont portés par `Object3D.userData`, ce qui évite une
structure parallèle à désynchroniser. Le `marker` est référencé directement dans
`userData` (et non retrouvé par inspection de géométrie), pour éviter tout
couplage à la forme du maillage.

**Conséquence produit** : une table n'est plus « un meuble libre » mais une place
caractérisée. `interaction/recommend.js` note chaque table selon les préférences du
client (zone, nombre de couverts, calme, éloignement des WC) et écarte les tables
incompatibles ou indisponibles.

### 5.2 Reservation (prévu — jalon W5)

| Champ | Type | Contrainte |
| --- | --- | --- |
| `id` | `uuid` | Clé primaire |
| `table_id` | `string` | Référence une table du plan (`T01`…`T06`) |
| `label` | `string` | Nom ou identifiant du client (démo) |
| `created_at` | `timestamptz` | `DEFAULT now()` |
| `status` | `enum` | `confirmed`, `cancelled`, `seated` |

Invariant métier : au plus une réservation `confirmed` active par table,
garanti par un index unique partiel côté base (voir `docs/PLANNING.md`, W5).

---

## 6. Machine à états des tables

```
                    sélection manette
      ┌──────────┐ ─────────────────► ┌──────────┐
      │available │                    │ reserved │
      └──────────┘ ◄───────────────── └──────────┘
           ▲          annulation (W4)       │
           │                                │ arrivée client (W5)
           │ départ client (W5)             ▼
      ┌──────────┐                    ┌──────────┐
      │  free    │                    │ occupied │
      └──────────┘                    └──────────┘
```

| État courant | Événement | État suivant | Implémenté |
| --- | --- | --- | --- |
| `available` | `selectstart` sur la table | `reserved` | ✅ W1 (client) |
| `reserved` | annulation utilisateur | `available` | ⬜ W4 |
| `reserved` | arrivée du client | `occupied` | ⬜ W5 |
| `occupied` | départ du client | `available` | ⬜ W5 |
| quelconque | action administrateur | `unavailable` | ⬜ W5 |
| `unavailable` | remise en service | `available` | ⬜ W5 |

Règles :

- Toute transition non listée est refusée (pas de `occupied → reserved` direct).
- Les transitions deviennent **idempotentes** dès qu'un serveur existe (W5) :
  rejouer le même événement ne doit pas produire d'effet supplémentaire.
- L'état affiché doit toujours dériver de l'état source, jamais d'une copie locale
  divergente (W5 : l'état serveur fait foi, le client reste optimiste puis réconcilie).

---

## 7. APIs navigateur sollicitées

| API | Rôle | Module | Preuve |
| --- | --- | --- | --- |
| **WebXR Device API** | Ouverture de session `immersive-vr`, poses tête/manettes | `xr/controllers.js` | `renderer.xr.enabled = true`, `VRButton.createButton` |
| **WebGPU** | Rendu GPU principal (three r187) | `core/renderer.js` | `new THREE.WebGPURenderer()` — `renderer.backend.isWebGPUBackend` |
| **WebGL 2.0** | Rendu GPU de repli, **y compris pendant une session XR** | `core/renderer.js` | `new THREE.WebGPURenderer({ forceWebGL: true })` via `setupWebGLXRFallback` |
| **WebXR Input Sources** | Manettes, `handedness`, `gamepad`, `gripSpace` | `xr/controllers.js` | `renderer.xr.getController(0)`, `getControllerGrip(0)` |
| **Gamepad API** | Axes joystick et gâchette (locomotion W4) | `xr/controllers.js` (à venir : `xr/locomotion.js`) | `session.inputSources[i].gamepad` |
| **`XRSession.requestAnimationFrame`** | Boucle synchronisée au casque | `main.js` | `renderer.setAnimationLoop(...)` |
| **Pointer Events** | Sélection à la souris, distinction clic / glisser d'orbite | `interaction/pointer.js` | `pointerdown` / `pointerup` + `getBoundingClientRect()` |
| **DOM API** | Panneau de statut, bouton VR, badge de backend | `ui/status-panel.js`, `ui/backend-badge.js`, `xr/controllers.js` | `document.getElementById('status')` |
| **Canvas 2D + `CanvasTexture`** | Panneau de statut lisible **dans le casque** | `ui/status-panel-3d.js` | `new THREE.CanvasTexture(canvas)` |
| **Raycaster (three.js)** | Intersection rayon ↔ tables | `interaction/selection.js` | `raycaster.intersectObjects(tablesGroup.children, true)` |

> `GLTFLoader` et `Fetch` ne sont **pas** utilisés par la version actuelle du code :
> l'intégration des modèles `.glb` du dossier `assets/` est planifiée en W4 et ne
> doit pas être documentée comme existante.

---

## 8. Contraintes d'exécution

1. **Contexte sécurisé obligatoire** : `localhost` ou HTTPS. Un serveur statique
   est requis (`python -m http.server 8000`) — `file://` casse l'import map.
2. **Modules ES uniquement** : Three.js ≥ r161 ne fournit plus de build UMD.
   La version est épinglée dans l'import map de `index.html` (r160 au jalon W1).
3. **Test sans casque** : extension Chrome *Immersive Web Emulator*. Le
   comportement manette y est simulé souris + clavier, ce qui ne valide **pas**
   l'ergonomie réelle.
4. **Test casque** : PC et casque sur le même réseau, serveur en `--bind 0.0.0.0`.

---

## 9. Conventions de développement

### 9.1 En-tête de fichier (obligatoire)

```javascript
/**
 * @file    src/<chemin>
 * @brief   <une phrase>
 * @author  <Nom> — <rôle>
 * @date    2026-11-10
 * @role    <responsabilité du module dans l'architecture>
 */
```

Vérifié automatiquement par `scripts/check-headers.mjs` (`npm run check:headers`).

### 9.2 Documentation des fonctions

Chaque fonction exportée porte un bloc JSDoc avec `@param` et `@returns`.
Les commentaires expliquent **pourquoi**, jamais la syntaxe évidente.

### 9.3 Qualité

| Outil | Commande | Bloquant |
| --- | --- | --- |
| En-têtes | `npm run check:headers` | Oui |
| ESLint (flat config, ES2022) | `npm run lint` | Oui |
| Prettier | `npm run format:check` | Oui |
| Vérification globale | `npm run verify` | Oui avant merge |

### 9.4 Git

- Convention **Conventional Commits** : `feat(xr):`, `fix(ui):`, `docs(specs):`,
  `chore(ci):`, `test(interaction):`.
- Une branche par jalon (`chore/engineering-baseline`, `feat/three-r187`, …),
  une Pull Request par jalon, `main` protégée, fusion en *squash*.
- Répartition des périmètres d'écriture : voir `CODEOWNERS` et `CONTRIBUTING.md`.

---

## 10. Procédure de vérification

```bash
npm install          # outils de développement uniquement
npm run verify       # en-têtes + ESLint + Prettier
python -m http.server 8000
# http://localhost:8000 → bouton "Enter VR" visible
```

Critères de recette manuelle :

1. La scène s'affiche, les 6 tables et leurs marqueurs colorés sont visibles.
2. Le rayon cyan suit la manette.
3. Viser une table disponible puis presser la gâchette → statut `reserved`,
   marqueur jaune, message « → Réservée ! ».
4. Viser le vide → « Aucune table visée ».
5. Redimensionner la fenêtre → pas de déformation.

### 10.1 Test fonctionnel exécutable

`tests/smoke.html` vérifie automatiquement, dans un vrai navigateur, la
construction du décor, l'état initial des six tables et l'intégralité de la
logique de sélection (raycasting, transition `available → reserved`, recoloration
du marqueur, contenu et couleur du panneau, message hors cible).

```
http://localhost:8000/tests/smoke.html
```

La page affiche une ligne `PASS`/`FAIL` par assertion et un décompte final.
Aucune dépendance supplémentaire n'est requise : le test consomme les modules
`src/**` par l'import map, exactement comme l'application.

> Ce test valide la **logique** ; il ne remplace pas la recette visuelle en casque.


---

## 11. Limites connues et dette technique

| ID | Limite | Impact | Jalon cible |
| --- | --- | --- | --- |
| DT-01 | ~~Three.js r160, aucun rendu WebGPU~~ **Résolu** : r187 + `WebGPURenderer` + repli WebGL2 | — | ✅ W2 |
| DT-02 | Aucun manifeste ni service worker | Application non installable / non hors-ligne | W3 |
| DT-03 | ~~Panneau de statut en DOM, invisible en session immersive~~ **Résolu** : panneau 3D texturé (`ui/status-panel-3d.js`) diffusé avec le panneau DOM | — | ✅ W2 |
| DT-04 | Téléportation absente : la caméra est fixe en VR | Confort et exploration limités | W4 |
| DT-05 | ~~`id` de table dérivé des coordonnées~~ **Résolu** : identifiants stables `T01`…`T16` dans `world/layout.js` | — | ✅ W3 |
| DT-06 | État des tables purement local (aucune persistance) | Deux utilisateurs ne partagent pas le même état | W5 |
| DT-07 | `assets/restaurant_in_the_evening.glb` (30,1 Mo) versionné sans Git LFS | Dépôt lourd, clones lents | W1 (`.gitattributes`) puis W4 |
| DT-08 | Licence des modèles Sketchfab non confirmée dans `ATTRIBUTION.md` | Risque juridique / remark de soutenance | Manuel — avant W2 |
| DT-09 | Aucun test automatisé | Pas de filet de sécurité avant le backend | W4 |

---

## 12. Historique du document

| Version | Date | Changement |
| --- | --- | --- |
| 0.1.0 | 2026-11-10 | Création : extraction de la documentation technique du README, modularisation du code (W1) |
