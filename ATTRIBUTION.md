# Attribution et origine des ressources — Restaurant XR

| Champ | Valeur |
| --- | --- |
| Projet | Restaurant XR — plateforme immersive de réservation |
| Équipe | Slim Selmi · Hazem Bellili · Wassim Hajji |
| Version du document | 2.0 (jalon W1) |
| Dernière mise à jour | 2026-11-10 |

> **Cette version remplace `fichier_attribution.txt`.** La version précédente
> déclarait l'utilisation de `GLTFLoader`, du clonage d'un personnage assis, de
> panneaux `CanvasTexture` et d'une détection de tables par nom de mesh : **aucune
> de ces fonctionnalités n'est présente dans le code livré**. Les déclarations ont
> été corrigées pour correspondre strictement à l'état du dépôt.

---

## 1. Modèles 3D

### 1.1 Restaurant intérieur — `assets/restaurant_in_the_evening.glb`

| Champ | Valeur |
| --- | --- |
| Titre | *Restaurant in the evening* |
| Source | <https://sketchfab.com/3d-models/restaurant-in-the-evening-42b57039275c4da0941a2706f617f95a> |
| Auteur | **Katydid** — <https://sketchfab.com/Katydid.> |
| Licence affichée | **Free Standard** (Sketchfab) — conditions : <https://sketchfab.com/licenses> |
| Mention complémentaire | Modèle marqué **NoAI** par son auteur (interdiction d'usage comme jeu de données d'entraînement) |
| Poids | 30,13 Mo |
| Modifications apportées | **Aucune** à ce jour. Le fichier est stocké tel que téléchargé. |
| Utilisation dans le code | **Non chargé** par l'application au jalon W1. Intégration prévue au jalon W4 (`docs/PLANNING.md`). |

### 1.2 Homme assis — `assets/a_man_sitting.glb`

| Champ | Valeur |
| --- | --- |
| Titre | *A man sitting* |
| Source | <https://sketchfab.com/3d-models/a-man-sitting-41b3107ced274de8a1c523d75272535e> |
| Auteur | Profil Sketchfab <https://sketchfab.com/1056878> (nom d'affichage non exposé sur la page) |
| Licence affichée | **CC Attribution (CC BY)** — l'attribution est obligatoire, y compris en cas de modification |
| Poids | 1,96 Mo |
| Modifications apportées | **Aucune** à ce jour. |
| Utilisation dans le code | **Non chargé** par l'application au jalon W1. Intégration prévue au jalon W4. |

> ⚠️ **Action obligatoire avant le jalon W4** : la licence *Free Standard* doit être
> relue sur <https://sketchfab.com/licenses> pour confirmer les droits de
> redistribution du fichier dans un dépôt public. Si la redistribution n'est pas
> autorisée, le modèle devra être retiré du dépôt et chargé à l'exécution depuis
> une source autorisée. Dette tracée : **DT-08**.

### 1.3 Ressources générées par le code (aucune licence tierce)

| Ressource | Origine | Licence |
| --- | --- | --- |
| Sol, murs, plafond, tapis, tableaux, lampes | Code original (`src/world/environment.js`) | MIT (ce dépôt) |
| Tables, chaises | Code original (`src/world/furniture.js`) | MIT (ce dépôt) |
| Marqueurs d'état colorés | Code original (`src/world/furniture.js`, cylindre émissif) | MIT (ce dépôt) |
| Rayon de visée, modèles de manettes | Three.js (`XRControllerModelFactory`) | MIT (Three.js) |

---

## 2. Bibliothèques tierces

Toutes les versions sont épinglées dans l'import map de `index.html`. Aucune
utilisation de `latest`.

| Bibliothèque | Version | Rôle effectif dans le code | Fichier |
| --- | --- | --- | --- |
| **three** | r187 (`0.187.0`) | Scène, matériaux, éclairage, raycasting, boucle XR | tous les modules |
| `three/addons/webxr/VRButton.js` | r187 | Bouton VR et encapsulation de `requestSession('immersive-vr')` | `src/xr/controllers.js` |
| `three/addons/webxr/ARButton.js` | r187 | Bouton AR et encapsulation de `requestSession('immersive-ar')` avec `local-floor` | `src/xr/controllers.js` |
| `three/addons/webxr/XRControllerModelFactory.js` | r187 | Modèles 3D officiels des manettes | `src/xr/controllers.js` |

`GLTFLoader` n'est pas utilisé à ce jour ; son ajout est planifié en W4.

---

## 3. Extraits de code adaptés

| Élément | Source | Adaptation |
| --- | --- | --- |
| `src/interaction/selection.js` — raycasting depuis la manette | Exemple officiel Three.js `webxr_xr_select` (<https://threejs.org/examples/#webxr_xr_select>), dépôt `mrdoob/three.js` | Extraction de la rotation du contrôleur (`Matrix4.extractRotation`), intersection restreinte au groupe des tables, remontée de hiérarchie jusqu'à `userData.isTable`, puis logique métier de réservation |
| `index.html` — import map ES Modules | Documentation Three.js, section installation (<https://threejs.org/manual/#installation>) | Réduite aux seuls modules réellement importés, version fixée |

Aucun autre extrait tiers n'est présent dans le code livré.

---

## 4. Déclaration d'usage des assistants IA

Conformément à la politique d'évaluation SUP'COM, l'usage d'outils d'assistance est
déclaré ci-dessous. Ces outils ont servi à la rédaction initiale et au débogage ;
chaque bloc a été relu, exécuté et validé par l'équipe.

| Périmètre | Usage | Vérification effectuée |
| --- | --- | --- |
| Structure initiale de la scène (Scène, caméra, renderer, éclairage) | Génération d'un squelette compatible WebXR | `renderer.xr.enabled = true` positionné avant tout appel à `getController()` ; contrôle visuel de l'éclairage dans l'émulateur puis sur casque |
| Sélection par raycasting | Exemple de raycast depuis un contrôleur | Contrôle de `extractRotation(controller.matrixWorld)` sur la documentation Three.js ; journalisation temporaire des intersections pour valider la remontée de hiérarchie |
| Documentation (`docs/`, README) | Structuration et relecture | Chaque affirmation a été confrontée au code ; les fonctionnalités absentes ont été retirées du README et du présent document |
| Modularisation et outillage (W1) | Refactorisation assistée, configuration ESLint/Prettier | `npm run verify` exécuté, recette manuelle de `technical_specs.md` §10 rejouée, comparaison du comportement avant/après |

---

## 5. Déclaration sur l'honneur

Nous, soussignés Slim Selmi, Hazem Bellili et Wassim Hajji, déclarons que :

- Le code du répertoire `src/` a été exécuté et validé par nos soins dans Chrome
  (avec *Immersive Web Emulator*) et sur navigateur Meta Quest lorsque le matériel
  était disponible.
- **Le code livré au jalon W1 ne charge aucun modèle 3D externe** : la scène est
  entièrement construite par code. Les fichiers `assets/*.glb` sont présents dans le
  dépôt mais ne sont pas encore utilisés.
- Chaque ressource externe effectivement utilisée est citée ci-dessus avec sa
  source, sa version et la nature de l'adaptation.
- Les licences affichées par Sketchfab pour les deux modèles sont reportées telles
  quelles, sans interprétation ; leur conformité à un usage en dépôt public reste à
  confirmer avant le jalon W4.
- L'usage d'assistants IA est documenté en section 4, et nous assumons la
  responsabilité technique et académique du rendu.

**Signatures** : Slim Selmi — Hazem Bellili — Wassim Hajji
*Fait à Tunis, 2026.*
