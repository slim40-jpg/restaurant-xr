# 🍽️ Restaurant XR

**Plateforme immersive de réservation avec visualisation 3D interactive**

Projet académique — Matière : **Extended Reality (XR)**
Établissement : **SUP'COM — École Supérieure des Communications de Tunis**
Enseignant : **Dr. Ing. Mohamed-Bécha Kaâniche**
Année universitaire : **2026–2027**

**Équipe :** Slim Selmi · Hazem Bellili · Wassim Hajji

---

## 📖 Description

**Restaurant XR** est une application web immersive qui transforme une réservation de restaurant classique en une expérience interactive en réalité étendue (XR).

L'utilisateur peut :

- Explorer virtuellement un restaurant modélisé en 3D
- Visualiser l'état des tables en temps réel (disponible / occupée / réservée / indisponible)
- Sélectionner une table directement dans la scène 3D avec une manette VR
- Réserver une table et voir un panneau "RÉSERVÉ" apparaître
- Voir un client virtuel assis aux tables occupées

L'objectif est d'explorer les possibilités de la **WebXR Device API** dans un navigateur standard, sans installation d'application native.

---

## 🎯 Fonctionnalités

| Fonctionnalité                     | Statut | Description                                         |
| ---------------------------------- | ------ | --------------------------------------------------- |
| Visualisation 3D du restaurant     | ✅     | Modèle GLTF importé depuis Sketchfab                |
| Navigation VR immersive            | ✅     | Session `immersive-vr` via WebXR                    |
| États visuels des tables           | ✅     | Marqueurs colorés (vert/rouge/jaune/gris)           |
| Client virtuel aux tables occupées | ✅     | Modèle 3D d'homme assis cloné dynamiquement         |
| Sélection de table par manette     | ✅     | Raycasting depuis le contrôleur WebXR               |
| Réservation interactive            | ✅     | Changement d'état en temps réel + panneau "RÉSERVÉ" |
| Téléportation (joystick)           | 🔄     | Prévu (voir section Améliorations)                  |
| Backend de réservation             | 🔄     | Prévu (état actuel : simulation locale)             |
| Mode PWA installable               | 🔄     | Prévu (cahier des charges §5)                       |

---

## 🛠️ Technologies utilisées

| Technologie                   | Version          | Rôle                                |
| ----------------------------- | ---------------- | ----------------------------------- |
| **Three.js**                  | r160 (`0.160.0`) | Moteur de rendu 3D WebGL            |
| **WebGL 2.0**                 | —                | Rendu graphique accéléré GPU        |
| **WebXR Device API**          | —                | Session immersive VR                |
| **Gamepad API**               | —                | Lecture joystick / boutons manettes |
| **WebXR Input Sources**       | —                | Suivi position/orientation manettes |
| **GLTFLoader**                | r160             | Chargement des modèles `.glb`       |
| **HTML5 / CSS3 / ES Modules** | —                | Interface et logique applicative    |

---

## 📡 APIs utilisées (documentation technique)

Cette section documente **chaque API** sollicitée par le projet, son rôle et où elle apparaît dans le code. C'est la partie à présenter en soutenance.

### 1. WebXR Device API

**Rôle :** API centrale du projet. Permet d'ouvrir une session immersive (`immersive-vr`), de recevoir les poses de la tête et des manettes, et de synchroniser le rendu avec le casque.

**Où c'est utilisé :**

```javascript
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
```

**Ce que fait `VRButton` en interne :**

```javascript
if (navigator.xr) {
  const supported = await navigator.xr.isSessionSupported("immersive-vr");
  const session = await navigator.xr.requestSession("immersive-vr", {
    optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
  });
}
```

**Référence :** [W3C WebXR Device API](https://www.w3.org/TR/webxr/)

---

### 2. WebGL 2.0

**Rôle :** Rendu 3D accéléré par le GPU. Toute la scène (restaurant, tables, hommes assis, marqueurs) est dessinée via WebGL.

**Où c'est utilisé :**

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
```

**Vérification :**

```javascript
console.log("WebGL 2.0 :", renderer.capabilities.isWebGL2);
```

**Référence :** [Khronos WebGL 2.0](https://www.khronos.org/webgl/)

---

### 3. Gamepad API (via WebXR Input Sources)

**Rôle :** Lire les entrées des manettes VR (joystick, gâchette, boutons). Chaque manette exposée par WebXR possède un objet `gamepad` conforme à la Gamepad API standard.

**Où c'est utilisé :**

```javascript
const controller = renderer.xr.getController(0);
controller.addEventListener("selectstart", onSelect);

// Lecture du joystick (pour téléportation future)
for (const source of session.inputSources) {
  if (source.handedness === "left" && source.gamepad) {
    const axes = source.gamepad.axes;
    const yAxis = axes[3];
  }
}
```

**Référence :** [W3C Gamepad API](https://www.w3.org/TR/gamepad/)

---

### 4. WebXR Input Sources

**Rôle :** Décrit les sources d'entrée (manettes, mains, regard). Chaque `XRInputSource` expose `handedness`, `targetRayMode`, `gamepad`, `gripSpace`.

**Où c'est utilisé :**

```javascript
const controllerModelFactory = new XRControllerModelFactory();
const controller = renderer.xr.getController(0);
const grip = renderer.xr.getControllerGrip(0);
grip.add(controllerModelFactory.createControllerModel(grip));
```

**Référence :** [W3C WebXR Input Profiles](https://www.w3.org/TR/webxr-input-profiles/)

---

### 5. `XRSession.requestAnimationFrame` (via `setAnimationLoop`)

**Rôle :** Boucle de rendu synchronisée avec le taux de rafraîchissement du casque (72/90/120 Hz). Utiliser `requestAnimationFrame` classique en VR provoquerait un malaise (motion sickness).

**Où c'est utilisé :**

```javascript
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
```

**Référence :** [W3C XRSession.requestAnimationFrame](https://www.w3.org/TR/webxr/#dom-xrsession-requestanimationframe)

---

### 6. Fetch API (via GLTFLoader)

**Rôle :** Télécharger les fichiers `.glb` du restaurant et de l'homme assis depuis le serveur.

**Où c'est utilisé :**

```javascript
const loader = new GLTFLoader();
loader.load('assets/restaurant.glb', (gltf) => { ... });
loader.load('assets/man_sitting.glb', (gltf) => { ... });
```

**Référence :** [WHATWG Fetch](https://fetch.spec.whatwg.org/)

---

### 7. Canvas API (via `CanvasTexture`)

**Rôle :** Générer dynamiquement le panneau "RÉSERVÉ" affiché au-dessus des tables réservées, sans texture externe.

**Où c'est utilisé :**

```javascript
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.fillText("RÉSERVÉ", 128, 64);
const texture = new THREE.CanvasTexture(canvas);
```

**Référence :** [WHATWG Canvas API](https://html.spec.whatwg.org/multipage/canvas.html)

---

### 8. DOM API & Pointer Events

**Rôle :** Manipulation de l'interface HTML (panneau de statut, bouton VR). Le clic sur le bouton "Enter VR" est **obligatoire** : les navigateurs exigent une interaction utilisateur avant `requestSession`.

**Où c'est utilisé :**

```javascript
document.getElementById("status").textContent = "Table sélectionnée";
document.body.appendChild(VRButton.createButton(renderer));
```

**Référence :** [W3C Pointer Events](https://www.w3.org/TR/pointerevents/)

---

### Tableau récapitulatif — Preuves en console

| API           | Preuve dans le code            | Preuve en console                 |
| ------------- | ------------------------------ | --------------------------------- |
| WebXR Device  | `renderer.xr.enabled = true`   | `navigator.xr !== undefined`      |
| WebGL 2.0     | `new THREE.WebGLRenderer()`    | `renderer.capabilities.isWebGL2`  |
| Gamepad       | `source.gamepad.axes`          | `session.inputSources[0].gamepad` |
| Input Sources | `renderer.xr.getController(0)` | `session.inputSources.length`     |
| XRSession rAF | `renderer.setAnimationLoop()`  | `renderer.info.render.frame`      |
| Fetch         | `GLTFLoader.load()`            | Onglet Réseau                     |
| Canvas        | `new THREE.CanvasTexture()`    | —                                 |
| DOM / Pointer | `VRButton.createButton()`      | —                                 |

---

## 📁 Structure du projet

```
restaurant-xr/
├── index.html              # Page principale + importmap
├── main.js                 # Logique 3D, VR et réservation
├── README.md               # Ce fichier
├── ATTRIBUTION.md          # Attribution des ressources
├── .gitignore              # Fichiers ignorés par Git
└── assets/
    ├── restaurant.glb      # Modèle 3D du restaurant (Sketchfab)
    └── man_sitting.glb     # Modèle 3D d'homme assis (Sketchfab)
```

---

## 🚀 Installation et lancement

### Prérequis

- Un navigateur compatible WebXR : **Chrome 79+**, **Edge 79+**, **Meta Quest Browser**
- Un serveur HTTP local (WebXR refuse `file://`)
- Optionnel : un casque VR (Meta Quest, HTC Vive, Valve Index…) ou l'extension **Immersive Web Emulator**

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-username/restaurant-xr.git
cd restaurant-xr

# 2. Lancer un serveur local
python -m http.server 8000
# ou
npx serve .
```

### Test sur ordinateur (sans casque)

1. Installer l'extension Chrome **[Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)**
2. Ouvrir `http://localhost:8000`
3. Cliquer sur l'icône de l'extension → la page simule un casque
4. Cliquer sur **"Enter VR"**
5. Pointer une table avec la souris et cliquer pour la réserver

### Test sur casque Meta Quest

1. S'assurer que le PC et le casque sont sur le même réseau WiFi
2. Trouver l'IP locale du PC (`ipconfig` sur Windows, `ifconfig` sur Mac/Linux)
3. Lancer le serveur en écoutant sur toutes les interfaces :
   ```bash
   python -m http.server 8000 --bind 0.0.0.0
   ```
4. Sur le casque, ouvrir `http://<IP-du-PC>:8000` dans le navigateur Meta Quest
5. Cliquer sur **"Enter VR"**

---

## 🎮 Utilisation

### En mode écran (desktop)

- **Souris** : explorer la scène (si OrbitControls activé)
- **Clic** : sélectionner une table
- **Bouton "Enter VR"** : basculer en mode immersif

### En mode VR (casque)

- **Manette droite** : pointer une table avec le rayon cyan
- **Gâchette** : sélectionner / réserver la table pointée
- **Panneau de statut** (en haut à gauche dans le casque) : affiche l'état de la table sélectionnée

### États des tables

| Couleur  | État          | Signification                       |
| -------- | ------------- | ----------------------------------- |
| 🟢 Vert  | `available`   | Table disponible                    |
| 🔴 Rouge | `occupied`    | Table occupée (homme assis visible) |
| 🟡 Jaune | `reserved`    | Table réservée (panneau "RÉSERVÉ")  |
| ⚫ Gris  | `unavailable` | Table indisponible                  |

---

## 🧪 Ce que la console doit afficher

Au chargement, la console (F12) doit afficher :

```
✅ Restaurant chargé
✅ Homme assis chargé
Sol détecté : ...
Tables détectées dans le GLTF : N
Chaises détectées : M
Table xxx → homme placé sur chaise proche (0.52m)
✅ N tables prêtes
```

Si `Tables détectées : 0`, la détection par nom a échoué → voir section **Dépannage**.

---

## 🔧 Dépannage

### Le bouton "Enter VR" n'apparaît pas

- Vérifier que la page est servie en `http://localhost` ou `https://` (pas `file://`)
- Vérifier que le navigateur supporte WebXR (Chrome, Edge, Meta Quest Browser)
- Installer Immersive Web Emulator pour tester sans casque

### Aucune table détectée

Ouvrir le `.glb` dans [gltf-viewer.donmccurdy.com](https://gltf-viewer.donmccurdy.com/), noter les noms exacts des meshes de tables, puis modifier dans `main.js` :

```javascript
if (name.includes('table') && ...) { ... }
```

Pour lister tous les noms :

```javascript
restaurantModel.traverse((child) => {
  if (child.isMesh) console.log("MESH:", child.name);
});
```

### L'homme assis est mal orienté / mal placé

Ajuster dans `detectTablesAndSetup()` :

```javascript
man.rotation.y += Math.PI; // demi-tour
man.position.y += 0.1; // décalage vertical
```

### L'homme est trop grand / trop petit

Le code ajuste automatiquement à 1,20 m via `Box3`. Si le résultat est incorrect, forcer manuellement :

```javascript
man.scale.setScalar(0.8);
```

### Les fichiers `.glb` sont refusés au push (> 50 MB)

Utiliser Git LFS :

```bash
git lfs install
git lfs track "*.glb"
git add .gitattributes
git add assets/
git commit -m "feat: add 3D models via Git LFS"
git push origin main
```

---

## 🔮 Améliorations futures

- [ ] **Téléportation** : déplacement par joystick dans le restaurant (logique `checkTeleportInput` prête)
- [ ] **Backend de réservation** : API REST (Node.js/Express + MongoDB ou Firebase) pour persistance réelle des réservations et synchronisation multi-utilisateurs
- [ ] **Authentification** : comptes client / administrateur
- [ ] **Mode PWA** : `manifest.json` + Service Worker pour installation et hors-ligne
- [ ] **Audio spatialisé** : ambiance sonore du restaurant (Web Audio API + `THREE.PositionalAudio`)
- [ ] **Hand tracking** : support des mains sans manettes (WebXR Hand Input)
- [ ] **Multi-utilisateurs** : session partagée (WebRTC ou WebSocket) pour voir les autres clients en temps réel

---

## 📚 Références

- [Three.js Documentation](https://threejs.org/docs/)
- [W3C WebXR Device API](https://www.w3.org/TR/webxr/)
- [W3C Gamepad API](https://www.w3.org/TR/gamepad/)
- [W3C WebXR Input Profiles](https://www.w3.org/TR/webxr-input-profiles/)
- [Khronos WebGL 2.0](https://www.khronos.org/webgl/)
- [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)
- [gltf-viewer.donmccurdy.com](https://gltf-viewer.donmccurdy.com/)

---

## 📄 Attribution des ressources

Les modèles 3D (`restaurant.glb`, `man_sitting.glb`) proviennent de **Sketchfab** et sont utilisés conformément à leur licence respective. Voir le fichier [`ATTRIBUTION.md`](./ATTRIBUTION.md) pour les détails complets (auteurs, licences, modifications).

Les bibliothèques tierces sont épinglées dans l'`importmap` de `index.html` (Three.js r160).

L'usage d'assistants IA (ChatGPT/Claude) est documenté dans `ATTRIBUTION.md` section 4, conformément à la politique d'évaluation SUP'COM.

---

## 👥 Équipe

| Membre            | Rôle                           |
| ----------------- | ------------------------------ |
| **Slim Selmi**    | Développement 3D / WebXR       |
| **Hazem Bellili** | Intégration assets / UI        |
| **Wassim Hajji**  | Logique de réservation / tests |

---

## 📝 Licence

Projet académique — SUP'COM 2026–2027.
Code source sous licence **MIT** (sauf assets 3D, voir `ATTRIBUTION.md`).

---

_Dernière mise à jour : 2026_

```

---

## Points à vérifier avant de rendre

1. **URL du dépôt** : remplacez `https://github.com/votre-username/restaurant-xr.git` par la vraie URL.
2. **Attribution** : remplissez les `[À REMPLIR]` dans `ATTRIBUTION.md` avec les infos Sketchfab réelles.
3. **Statut des fonctionnalités** : dans le tableau, ajustez les 🔄 en ✅ si vous implémentez la téléportation ou le backend avant la soutenance.
4. **README bilingue** (optionnel) : si votre jury est francophone uniquement, gardez tel quel. Si vous voulez aussi une version anglaise, ajoutez `README.en.md`.

Si vous voulez, je peux aussi générer le fichier `LICENSE` (MIT) et le `.gitignore` complet à mettre à la racine du dépôt.

```
