# Migration Three.js r160 → r187 — décisions et preuves

| Champ | Valeur |
| --- | --- |
| Jalon | W2 |
| Date | 2026-11-11 |
| Auteur | Slim Selmi (3D / WebXR) |
| Fichiers concernés | `index.html`, `src/core/renderer.js`, `src/xr/controllers.js`, `src/ui/backend-badge.js`, `src/ui/webgpu-gate.js` |

---

## 1. Pourquoi migrer

Le jury a relevé que la version r160 empêchait tout usage de WebGPU. Or Three.js
ne fournit plus de build UMD depuis r161 : rester en r160 n'est pas seulement
« ancien », c'est une impasse technique. La version stable au moment de la
migration est **r187** (publiée le 2026-10-30, `three@0.187.0`).

---

## 2. Ce qui change concrètement

| Élément | r160 (avant) | r187 (après) |
| --- | --- | --- |
| Import map | `unpkg.com/three@0.160.0/build/three.module.js` | `cdn.jsdelivr.net/npm/three@0.187.0/build/three.webgpu.js` + `three/webgpu` + `three/tsl` |
| Renderer | `THREE.WebGLRenderer` | `THREE.WebGPURenderer` (`three/webgpu`) |
| Repli | aucun | **aucun** (WebGPU obligatoire, WebGL2 interdit) |
| Ombres | `PCFSoftShadowMap` | `PCFShadowMap` (`PCFSoftShadowMap` supprimé en r185) |
| Bouton VR | `VRButton.createButton(renderer)` | `+ { optionalFeatures: ['local-floor','bounded-floor','webgpu'] }` |
| Visibilité du backend | aucune | badge permanent (`WebGPU · actif` vert / `WebGPU · indisponible` rouge) |

### Point critique : `"three"` doit pointer vers le **même** build

`build/three.webgpu.js` **n'exporte pas** `WebGLRenderer`, et les addons
(`VRButton`, `OrbitControls`, `GLTFLoader`…) font `from 'three'`. Si `"three"`
résolvait vers `three.module.js` pendant que l'application importe
`three/webgpu`, deux graphes de modules parallèles seraient chargés et les
contrôles de type `instanceof` échoueraient silencieusement. L'import map mappe
donc les deux entrées vers `three.webgpu.js`.

---

## 3. Décision : WebGPU obligatoire

### Ce qui a été retiré

| Élément retiré | Emplacement | Raison |
| --- | --- | --- |
| `setupWebGLXRFallback` | `src/core/renderer.js` | Repli automatique vers WebGL2 pendant une session XR : masquait un échec WebGPU et compensait une limite de compatibilité. |
| `new WebGPURenderer({ forceWebGL: true })` | `src/core/renderer.js` | Second renderer construit à la volée, avec son propre canvas : deux chemins de rendu à maintenir, deux comportements à tester. |
| État `WebGL 2 · repli` | `src/ui/backend-badge.js` | Le badge ne doit plus jamais présenter un backend de secours comme un état acceptable. |

La vérification se fait désormais **après** `await renderer.init()`, sur le backend
réellement obtenu :

```js
const backend = renderer.backend;
const isWebGPU = Boolean(backend && backend.isWebGPUBackend === true);
```

Three.js bascule seul sur son backend WebGL2 lorsqu'aucun adaptateur n'est accordé.
Ce basculement n'est plus accepté : il est détecté, puis l'application s'arrête.

### Conséquence assumée

Sur un casque qui n'expose pas `XRGPUBinding`, **la session immersive n'est plus
possible**. Le repli WebGL2 était une solution de compatibilité ; il est supprimé
volontairement. Le produit ne prétend plus fonctionner sur du matériel qui ne
fournit pas le chemin WebGPU/WebXR : il refuse de démarrer plutôt que de rendre
dans un backend que la spécification de l'application n'autorise plus.

### La parade : un échec visible, pas un écran noir

`src/core/renderer.js` expose `init()` qui retourne `{ supported, reason }` sans
jamais lever d'exception :

| `reason` | Situation |
| --- | --- |
| `no-navigator-gpu` | `navigator.gpu` absent (navigateur trop ancien, API désactivée) |
| `no-adapter` | WebGPU présent, mais Three.js a obtenu son backend WebGL2 : aucun adaptateur GPU accordé |
| `unsupported-backend` | Backend inattendu, ou `renderer.init()` a échoué |

En cas d'échec, le canvas est retiré, aucune boucle de rendu n'est planifiée
(`setAnimationLoop` est un no-op tant que `supported` est faux) et
`src/ui/webgpu-gate.js` affiche un écran plein cadre « WebGPU requis » : cause
lisible, procédure de correction, bouton « Réessayer » qui recharge la page.
Le badge expose l'état `WebGPU · indisponible` (point rouge) dès que la cause lui
est transmise par l'appelant. Plus aucun écran noir silencieux.

### Procédure de vérification

1. Ouvrir `chrome://gpu` : la ligne **WebGPU** doit indiquer `Hardware accelerated`.
2. Dans la console, vérifier que l'API et l'adaptateur sont disponibles :

   ```js
   navigator.gpu; // → GPU {}
   await navigator.gpu.requestAdapter(); // → GPUAdapter (jamais null)
   ```

3. Recharger l'application : le badge doit afficher `WebGPU · actif`.
4. Si `requestAdapter()` renvoie `null` : activer `chrome://flags/#enable-unsafe-webgpu`,
   relancer le navigateur, puis revérifier l'étape 1.

---

## 4. Preuves d'exécution

Environnement de vérification : Edge headless (`--disable-gpu`), page servie en
HTTP, aucune extension XR. Aucun adaptateur GPU n'est accordé dans cet
environnement : c'est le cas d'échec qui doit désormais être explicite.

```
REVISION: 187
WebGPURenderer exporté: function
navigator.gpu: object
renderer.init(): résolu
renderer.backend: WebGLBackend
isWebGPUBackend: false
verdict init: { supported: false, reason: 'no-adapter' }
frames rendues: 0
canvas présent: false (retiré après échec)
écran de blocage: « WebGPU requis » affiché
erreur console: aucune
```

Journal navigateur correspondant :

```
"No available adapters."
"THREE.WebGPURenderer: WebGPU is not available, running under WebGL2 backend."
```

Interprétation : Three.js a bien tenté WebGPU, puis est retombé seul sur son
backend WebGL2 faute d'adaptateur. Ce repli n'est plus utilisé : le backend est
rejeté, zéro frame est rendue, le canvas est retiré et l'écran de blocage est
affiché. C'est la preuve que la bascule silencieuse a disparu.

> Sur un poste avec GPU, `navigator.gpu.requestAdapter()` renvoie un adaptateur,
> le backend est `WebGPUBackend`, le badge affiche `WebGPU · actif` et la boucle
> démarre. Sur un casque sans `XRGPUBinding`, l'application reste sur WebGPU et
> la session XR échoue à l'ouverture — comportement assumé depuis la suppression
> du repli.

---

## 5. Points d'attention non traités

| Sujet | État | Traitement |
| --- | --- | --- |
| Réétalonnage de l'éclairage | À faire | `useLegacyLights` supprimé en r165 ; changements énergétiques en r181. Les intensités actuelles sont conservées telles quelles ; un réglage esthétique est à prévoir sur captures avant/après. |
| `ShaderMaterial` / `onBeforeCompile` | Non utilisé | Aucune occurrence dans `src/**` : rien à porter. |
| Multiview en WebGPU XR | Non supporté par Three.js | Aucun repli. L'option `multiview` est laissée au renderer ; la session XR échoue sans `XRGPUBinding`, conformément à la décision WebGPU obligatoire. |
| Post-traitement | Non utilisé | Aucun `EffectComposer` : rien à porter vers `RenderPipeline`. |

---

## 6. Références

- Three.js r187 : <https://github.com/mrdoob/three.js/releases/tag/r187>
- Manuel d'installation (import map) : <https://threejs.org/manual/#installation>
- `WebGPURenderer` : <https://threejs.org/manual/#webgpurenderer>
- WebGPU dans Chrome : <https://developer.chrome.com/docs/gpu/webgpu>
- Guide de migration : <https://github.com/mrdoob/three.js/wiki/Migration-Guide>
