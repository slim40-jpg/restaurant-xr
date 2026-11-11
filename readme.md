# 🍽️ Restaurant XR

Application web immersive de réservation de restaurant : une scène 3D explorable
dans le navigateur, une session VR WebXR, et des tables que l'on réserve en les
pointant avec une manette.

Projet académique — **Extended Reality (XR)** · SUP'COM · 2026–2027
Encadrant : **Dr. Ing. Mohamed-Bécha Kaâniche**
Équipe : **Slim Selmi · Hazem Bellili · Wassim Hajji**

> **Jalon courant : W2 — Rendu moderne et démonstration utilisable** (Three.js r187,
> WebGPU avec repli WebGL2, sélection à la souris, panneau d'état lisible dans le
> casque). Voir [`docs/PLANNING.md`](docs/PLANNING.md) et
> [`docs/MIGRATION_R160_R187.md`](docs/MIGRATION_R160_R187.md).

---

## Aperçu fonctionnel

| Fonctionnalité | État | Jalon |
| --- | --- | --- |
| Scène 3D du restaurant (sol, murs, plafond, 6 tables, chaises, lampes) | ✅ | — |
| Session immersive `immersive-vr` (WebXR) | ✅ | — |
| Manette VR avec modèle 3D et rayon de visée | ✅ | — |
| Sélection d'une table par raycasting | ✅ | — |
| États de table : disponible / occupée / réservée / indisponible | ✅ | — |
| Réservation d'une table disponible (transition d'état visible) | ✅ | — |
| Three.js r187 + `WebGPURenderer` avec repli WebGL2 automatique | ✅ | W2 |
| Badge de backend affiché à l'écran (preuve visible) | ✅ | W2 |
| Utilisation sans casque : orbite à la souris + clic pour réserver | ✅ | W2 |
| Panneau d'état 3D lisible **dans** le casque | ✅ | W2 |
| PWA installable et fonctionnement hors-ligne | 🔄 | W3 |
| Téléportation au joystick | 🔄 | W4 |
| Backend de réservation et synchronisation multi-utilisateur | 🔄 | W5 |

Le détail des exigences, de l'architecture et de la dette technique est dans
[`docs/technical_specs.md`](docs/technical_specs.md).

---

## Stack

| Brique | Version | Rôle |
| --- | --- | --- |
| Three.js | r187 (`0.187.0`) | Rendu 3D : `WebGPURenderer`, repli WebGL2 |
| WebGPU | — | Backend de rendu principal (three r187) |
| WebGL 2.0 | — | Backend de repli, y compris pendant une session XR |
| WebXR Device API | — | Session immersive et poses des manettes |
| WebXR Input Sources / Gamepad API | — | Modèles de manettes, axes et gâchettes |
| ES Modules + import map | — | Aucune étape de build à ce jour |
| ESLint · Prettier · Node | ESLint 9, Prettier 3, Node 20+ | Qualité et formatage |

---

## Démarrage

### Prérequis

- Chrome 79+, Edge 79+ ou le navigateur Meta Quest.
- Un serveur HTTP local : WebXR refuse `file://` et l'import map ne fonctionne
  qu'en `http://localhost` ou `https://`.
- Node.js 20+ uniquement pour les outils de développement (lint/format).
- Optionnel : un casque, ou l'extension Chrome **Immersive Web Emulator**.

### Lancer le projet

```bash
git clone https://github.com/slim40-jpg/restaurant-xr.git
cd restaurant-xr

# outils de développement (facultatif pour simplement voir l'application)
npm install

# serveur statique
python -m http.server 8000
# ou : npx serve .
```

Ouvrir <http://localhost:8000>, puis cliquer sur **Enter VR**.

### Tester sur un casque Meta Quest

```bash
python -m http.server 8000 --bind 0.0.0.0
```

PC et casque sur le même Wi-Fi, puis ouvrir `http://<IP-du-PC>:8000` dans le
navigateur du casque.

### Commandes

| Commande | Effet |
| --- | --- |
| `npm run verify` | En-têtes + ESLint + Prettier (bloquant avant Pull Request) |
| `npm run check:headers` | Vérifie `@file`, `@author`, `@date`, `@role` sur chaque module |
| `npm run lint` | ESLint (configuration plate, ES2022) |
| `npm run format` | Prettier sur `src/`, `scripts/`, `*.html` |

---

## Utilisation

**Au clavier / à la souris** — aucun casque nécessaire :

- **Glisser** avec le bouton gauche : tourner autour de la salle (orbite bornée,
  jamais sous le sol).
- **Molette** : zoomer entre 1,5 m et 9 m.
- **Cliquer** sur une table : elle passe à l'état *réservée* et le panneau de statut
  (en haut à gauche **et** au fond de la salle) affiche le résultat.

**En VR** : viser une table avec le rayon cyan de la manette droite, presser la
gâchette. Une table disponible passe à l'état *réservé* (marqueur jaune) ; le
panneau au fond de la salle affiche la confirmation, ce qui le rend lisible à
l'intérieur du casque.

| Couleur | État | Signification |
| --- | --- | --- |
| 🟢 Vert | `available` | Disponible |
| 🔴 Rouge | `occupied` | Occupée |
| 🟡 Jaune | `reserved` | Réservée |
| ⚫ Gris | `unavailable` | Indisponible |

---

## Structure du dépôt

```
restaurant-xr/
├── index.html              # Page hôte, import map, panneau de statut
├── src/
│   ├── main.js             # Amorçage : câblage des modules, boucle de rendu
│   ├── config/             # Constantes et plan des tables
│   ├── core/               # Renderer WebGPU + repli WebGL2, scène, éclairage
│   ├── world/              # Décor, mobilier, composition du restaurant
│   ├── xr/                 # Manettes, bouton VR, rayon de visée
│   ├── interaction/        # Sélection (manette/souris), orbite, transition d'état
│   └── ui/                 # Panneaux de statut DOM et 3D, badge de backend
├── docs/                   # Spécifications, planning, architecture, ADR
├── scripts/                # Vérificateur d'en-têtes
├── tests/                  # Test fonctionnel navigateur (tests/smoke.html)
├── assets/                 # Modèles 3D (non chargés par la version actuelle)
└── package.json            # Outils de développement et scripts
```

---

## Documentation

| Document | Contenu |
| --- | --- |
| [`docs/technical_specs.md`](docs/technical_specs.md) | Exigences, architecture, modèle de données, APIs, dette technique |
| [`docs/PLANNING.md`](docs/PLANNING.md) | Jalons W1–W5, critères d'acceptation, risques, feuille de route |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Graphe de modules, flux d'exécution, invariants |
| [`docs/MIGRATION_R160_R187.md`](docs/MIGRATION_R160_R187.md) | Migration Three.js, WebGPU et preuves d'exécution |
| [`docs/DEMO_LOG.md`](docs/DEMO_LOG.md) | Preuve d'avancement semaine par semaine |
| [`docs/adr/`](docs/adr/) | Décisions d'architecture et alternatives écartées |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branches, commits, revues, périmètres d'écriture |

Test fonctionnel : ouvrir `http://localhost:8000/tests/smoke.html` — 18 assertions
sur la construction du décor, les états initiaux, la sélection (manette **et**
souris), le panneau 3D et la diffusion d'état.

---

## Équipe et répartition

| Membre | Rôle | Périmètre de code |
| --- | --- | --- |
| **Slim Selmi** | Développement 3D / WebXR | `src/core/**`, `src/world/**`, `src/xr/**` |
| **Hazem Bellili** | Intégration assets / UI | `src/ui/**`, `assets/**`, styles |
| **Wassim Hajji** | Logique de réservation / tests | `src/main.js`, `src/config/**`, `src/interaction/**`, tests |

---

## Licence et attribution

Code sous licence **MIT** — voir [`LICENSE`](LICENSE).
Les modèles 3D proviennent de Sketchfab ; auteurs, licences et modifications sont
détaillés dans [`ATTRIBUTION.md`](ATTRIBUTION.md).

> ⚠️ Les modèles `assets/*.glb` ne sont **pas encore chargés** par l'application :
> leur intégration est planifiée au jalon W4, après compression et vérification
> des licences.

---

## Limites connues

- Aucune persistance : l'état des tables est local à l'onglet (backend en W5).
- Aucun mode hors-ligne ni installation (PWA en W3).
- Téléportation absente : en VR la caméra reste à sa position d'entrée (W4).
- WebGPU+WebXR est encore expérimental côté navigateurs : le repli WebGL2 prend le
  relais automatiquement, et le badge l'indique.

Liste complète et priorisée : [`docs/technical_specs.md`](docs/technical_specs.md) §11.
