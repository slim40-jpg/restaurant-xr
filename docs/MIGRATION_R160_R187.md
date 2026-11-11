# Migration Three.js r160 → r187 — décisions et preuves

| Champ | Valeur |
| --- | --- |
| Jalon | W2 |
| Date | 2026-11-11 |
| Auteur | Slim Selmi (3D / WebXR) |
| Fichiers concernés | `index.html`, `src/core/renderer.js`, `src/xr/controllers.js`, `src/ui/backend-badge.js` |

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
| Repli | aucun | `WebGLXRFallback` (repli officiel, y compris en session XR) |
| Ombres | `PCFSoftShadowMap` | `PCFShadowMap` (`PCFSoftShadowMap` supprimé en r185) |
| Bouton VR | `VRButton.createButton(renderer)` | `+ { optionalFeatures: ['local-floor','bounded-floor','webgpu'] }` |
| Visibilité du backend | aucune | badge permanent (`WebGPU` vert / `WebGL 2 · repli` ambre) |

### Point critique : `"three"` doit pointer vers le **même** build

`build/three.webgpu.js` **n'exporte pas** `WebGLRenderer`, et les addons
(`VRButton`, `OrbitControls`, `GLTFLoader`…) font `from 'three'`. Si `"three"`
résolvait vers `three.module.js` pendant que l'application importe
`three/webgpu`, deux graphes de modules parallèles seraient chargés et les
contrôles de type `instanceof` échoueraient silencieusement. L'import map mappe
donc les deux entrées vers `three.webgpu.js`.

### Point critique : WebXR sur WebGPU est encore expérimental

La session exige la fonctionnalité `webgpu` et l'interface `XRGPUBinding`, et le
multiview n'est pas supporté sur ce chemin. Sur un casque qui n'expose pas
`XRGPUBinding`, le renderer WebGPU ne peut pas composer l'image : écran noir.
`setupWebGLXRFallback` (addon officiel) intercepte `xr.setSession()` et remplace
le renderer par `new WebGPURenderer({ forceWebGL: true })` **au moment de
l'ouverture de session**. C'est la raison pour laquelle le repli n'est pas une
option de confort mais une condition de fonctionnement.

`renderer.xr.enabled = true` est positionné **avant** l'initialisation : la
requête d'adaptateur GPU est faite avec `xrCompatible`.

---

## 3. Preuves d'exécution

Environnement de vérification : Edge headless (`--disable-gpu`), page servie en
HTTP, aucune extension XR.

```
REVISION: 187
WebGPURenderer exporté: function
navigator.gpu: object
frames rendues: 2
renderer.backend: WebGLBackend
isWebGPUBackend: false
isWebGLBackend: true
canvas data-engine: three.js r187 webgpu
canvas présent: true
erreur console: aucune
```

Journal navigateur correspondant :

```
"No available adapters."
"THREE.WebGPURenderer: WebGPU is not available, running under WebGL2 backend."
```

Interprétation : le chemin WebGPU est bien instancié ; faute d'adaptateur
(graphique désactivé en headless), Three.js bascule seul sur son backend WebGL2
et le rendu fonctionne. C'est exactement le comportement attendu — et c'est la
preuve que le repli existe réellement.

> Sur un poste avec GPU, `navigator.gpu.requestAdapter()` renvoie un adaptateur et
> le badge affiche `WebGPU · actif`. Sur un casque sans `XRGPUBinding`, le badge
> passe à `WebGL 2 · repli` dès l'ouverture de session.

---

## 4. Points d'attention non traités

| Sujet | État | Traitement |
| --- | --- | --- |
| Réétalonnage de l'éclairage | À faire | `useLegacyLights` supprimé en r165 ; changements énergétiques en r181. Les intensités actuelles sont conservées telles quelles ; un réglage esthétique est à prévoir sur captures avant/après. |
| `ShaderMaterial` / `onBeforeCompile` | Non utilisé | Aucune occurrence dans `src/**` : rien à porter. |
| Multiview en WebGPU XR | Non supporté par Three.js | Le repli WebGL2 reprend `OVR_multiview2`. |
| Post-traitement | Non utilisé | Aucun `EffectComposer` : rien à porter vers `RenderPipeline`. |

---

## 5. Références

- Three.js r187 : <https://github.com/mrdoob/three.js/releases/tag/r187>
- Manuel d'installation (import map) : <https://threejs.org/manual/#installation>
- `WebGPURenderer` : <https://threejs.org/manual/#webgpurenderer>
- Repli XR (PR #33497) : <https://github.com/mrdoob/three.js/pull/33497>
- Guide de migration : <https://github.com/mrdoob/three.js/wiki/Migration-Guide>
