# Restaurant XR — El Nacional

**Un bistrot barcelonais à visiter dans le navigateur : on entre par la rue, on marche dans la nef, on choisit sa place sur le plan, on lit la carte — sur écran ou en réalité virtuelle.**

Projet académique — **Extended Reality (XR)** · SUP'COM · 2026–2027
Encadrant : **Dr. Ing. Mohamed-Bécha Kaâniche** · Équipe : **Slim Selmi · Hazem Bellili · Wassim Hajji**

[![Three.js](https://img.shields.io/badge/three.js-r187-black)](https://threejs.org/)
[![WebGPU](https://img.shields.io/badge/WebGPU-obligatoire-4ade80)](docs/MIGRATION_R160_R187.md)
[![PWA](https://img.shields.io/badge/PWA-installable-6e40c9)](docs/PWA.md)
[![Tests](https://img.shields.io/badge/tests-29%20assertions-brightgreen)](tests/smoke.html)
[![Licence](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

---

## Le lieu

Une **nef unique de 8 m** éclairée par cinq verrières, couverte de **quinze voûtes catalanes**,
portée par des **colonnes de fonte** — la structure d'un ancien théâtre devenu tannerie, puis
garage, réouvert en 2014 comme espace gastronomique. Le plan n'est pas un rectangle : les
**quatre angles sont arrondis** et deux **arcades** rythment le mur du fond.

```
        façade sur rue — auvent, enseigne, deux vitrines
   ┌───────────────────────────────────────────────────┐
   │  ⌒                                               ⌒ │   ← angles arrondis (r 2,2 m)
   │   T01 T02 T03 T04 T05                             │   ← baie vitrée (5 tables)
   │                                                   │
   │        ▭▭▭▭▭        ▭▭▭▭▭        ▭▭▭▭▭            │   ← 3 îlots de bar (marbre, laiton)
   │            T12   T13   T14                        │   ← salle (3 tables)
   │   T06 T07          T10          T11               │   ← coin + banquette (6 tables)
   │                                                   │
   │            bar à huîtres · vins · jambon           │
   └───────────────────────────────────────────────────┘
     T17  T18  T19  T20  →  terrasse bois, pergola, haies
```

| Espace | Contenu |
| --- | --- |
| **Nef** | 16 tables sur 5 zones, 3 îlots de bar, bar à huîtres, étagère à vins, jambon ibérique, roues suspendues, vitrine de maturation |
| **Terrasse** | 4 tables, pergola, guirlandes, haies en bacs |
| **Façade** | soubassement de pierre, deux vitrines à barreaudage, auvent rouge, enseigne émaillée, lanternes, jardinières |

Les sources du lieu et les choix de reconstitution sont documentés dans
[`docs/WORLD.md`](docs/WORLD.md).

---

## Fonctionnalités

| Fonctionnalité | État | Jalon |
| --- | --- | --- |
| Nef de 8 m : 15 voûtes, 6 colonnes, 5 verrières | ✅ | W4 |
| Angles arrondis, arcades, porte cintrée | ✅ | W4 |
| 20 tables (16 nef + 4 terrasse), 5 zones, capacités 2/4/6 | ✅ | W4 |
| Mobilier contemporain : terrazzo à chant laiton, chaises coque | ✅ | W4 |
| **Choix de la place** : fenêtre, coin, banquette, bar, au calme, loin des WC | ✅ | W3 |
| **Fiche de table + carte** (18 plats barcelonais) et réservation explicite | ✅ | W4 |
| **Marche à hauteur d'yeux** : ZQSD/WASD, souris, balancement, escalier | ✅ | W4 |
| **Sélection au réticule** pendant la marche | ✅ | W4 |
| Session immersive VR (`immersive-vr`) | ✅ | W2 |
| Session AR (`immersive-ar`) : pose sur surface détectée | ✅ | W3 |
| Rendu **WebGPU obligatoire**, écran de blocage explicite si absent | ✅ | W2 |
| **PWA installable**, hors-ligne, mise à jour signalée | ✅ | W3 |
| Backend de réservation et synchronisation multi-utilisateur | ⬜ | W5–W6 |

---

## Démarrage

```bash
git clone https://github.com/slim40-jpg/restaurant-xr.git
cd restaurant-xr
npm install            # outils de développement uniquement
python -m http.server 8000
```

Ouvrir **http://localhost:8000**.

> **WebGPU est requis.** Sans adaptateur, l'application affiche un écran « WebGPU requis »
> avec la marche à suivre, au lieu de basculer silencieusement en WebGL. Vérifier avec
> `chrome://gpu` → `WebGPU: Hardware accelerated`, ou dans la console :
> `navigator.gpu.requestAdapter().then(console.log)`.

`localhost` est obligatoire : c'est le seul contexte (avec HTTPS) où service worker,
installation PWA et WebXR fonctionnent ensemble.

### Commandes

| Commande | Effet |
| --- | --- |
| `npm run verify` | En-têtes + **contrôle du plan** + ESLint + Prettier |
| `npm run check:headers` | `@file`, `@author`, `@date`, `@role` et ≤ 200 lignes par module |
| `npm run check:layout` | 20 tables, distances minimales, dégagements, hauteurs praticables |
| `npm run lint` / `format` | ESLint (flat config) / Prettier |

### Contrôles

| Action | Touche |
| --- | --- |
| Marcher | `ZQSD` ou `WASD`, flèches en secours ; `Maj` pour courir |
| Regarder | Souris (pointer lock, `Échap` pour libérer) |
| Changer de mode | `V` — Marcher ↔ Orbite |
| Couper le balancement | `M` (respecte `prefers-reduced-motion`) |
| Choisir une table | Clic au **réticule** en marchant, ou clic direct en orbite |
| Réserver | Bouton de la fiche, jamais par un simple clic |

---

## Architecture

Découpage en **47 modules** à responsabilité unique, aucune dépendance circulaire, aucun
fichier au-delà de 200 lignes.

```
src/
├── main.js               câblage (199 lignes, aucune règle métier)
├── config/               constantes, carte du restaurant
├── core/                 renderer WebGPU, scène, service worker
├── world/                plan, architecture, voûtes, façade, décor, mobilier, surfaces praticables
├── xr/                   manette VR, mode AR (hit-test, réticule), portes
├── interaction/          sélection, souris, orbite, marche, moteur de recommandation
└── ui/                   fiche table, carte, préférences, panneaux, réticule, écran de blocage
```

Trois décisions portent le reste :

1. **Le plan est une donnée, pas du code.** `world/layout.js` décrit les 20 tables (position,
   zone, capacité, caractéristiques, niveau) ; `scripts/check-layout.mjs` prouve les
   distances et échoue si une table empiète. `npm run verify` l'exécute.
2. **Sélectionner n'est pas réserver.** Le clic ouvre une fiche et la carte ; la transition
   `available → reserved` n'existe que dans `reserve()`, appelée par un bouton explicite.
3. **Le backend de rendu est vérifié, pas supposé.** `core/renderer.js` interroge le backend
   après `init()` et bloque l'application si WebGPU n'est pas actif — le badge affiche
   toujours le backend réellement utilisé.

Détail complet : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Qualité

```bash
$ npm run verify
47/47 fichier(s) conforme(s).
Plan conforme.
All matched files use Prettier code style!
(eslint : aucune erreur)
```

- **29 assertions** dans un vrai navigateur (`tests/smoke.html`) : construction du décor,
  identifiants stables, niveaux, sélection sans réservation, `reserve()` idempotent,
  classement déterministe des tables, panneau 3D, clic vs glisser.
- **Contrôle du plan** exécuté à chaque `verify` : 20 tables, écart minimal entre centres,
  dégagement des murs, hauteurs praticables.
- **Logique de marche testée hors navigateur** : collision (arrêt à 0,280 m du mur
  = rayon du joueur), glissement le long d'un mur, montée d'escalier, écrêtage du tangage.
- **Preuves par jalon** : commandes, sorties réelles et points non vérifiés dans
  [`docs/DEMO_LOG.md`](docs/DEMO_LOG.md).

---

## Documentation

| Document | Contenu |
| --- | --- |
| [`docs/technical_specs.md`](docs/technical_specs.md) | Exigences, modèle de données, machine à états, APIs, dette |
| [`docs/WORLD.md`](docs/WORLD.md) | Le lieu : niveaux, voûtes, surfaces praticables, sources |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Graphe de modules, flux, invariants |
| [`docs/CONTROLS.md`](docs/CONTROLS.md) | Commandes et ressenti de la caméra |
| [`docs/MENU.md`](docs/MENU.md) | Carte barcelonaise et choix de conception |
| [`docs/PWA.md`](docs/PWA.md) | Installabilité, hors-ligne, audit |
| [`docs/AR.md`](docs/AR.md) | Mode réalité augmentée et limites |
| [`docs/MIGRATION_R160_R187.md`](docs/MIGRATION_R160_R187.md) | Migration Three.js et décision WebGPU |
| [`docs/DEMO_LOG.md`](docs/DEMO_LOG.md) | Journal de preuves par semaine |
| [`docs/prompts/`](docs/prompts/) | Journal des prompts et des modèles utilisés |
| [`docs/adr/`](docs/adr/) | Décisions d'architecture |

---

## Équipe

| Membre | Rôle | Périmètre |
| --- | --- | --- |
| **Slim Selmi** | Développement 3D / WebXR | `src/core/**`, `src/world/**`, `src/xr/**` |
| **Hazem Bellili** | Intégration assets / UI | `src/ui/**`, `assets/**`, styles |
| **Wassim Hajji** | Réservation / tests / backend | `src/main.js`, `src/config/**`, `src/interaction/**`, `tests/**` |

---

## Limites assumées

- **Pas de backend** : l'état des tables est local à l'onglet (W5–W6).
- **Pas de session validée sur casque** : WebGPU-XR reste expérimental ; le mode VR dépend
  du navigateur du casque.
- **AR non testée sur appareil ARCore** : implémentation et repli vérifiés, pose non.
- **Pas de personnages** : la salle est vide, ce qui trahit encore la maquette.
- **Captures d'écran non régénérées** : le rendu WebGPU ne produit pas de frame en
  environnement headless ; `tools/preview.html` permet un aperçu WebGL sur une machine
  avec GPU.

---

## Licence

Code sous **MIT** — voir [`LICENSE`](LICENSE). Les modèles 3D de `assets/` ne sont pas
couverts par cette licence : voir [`ATTRIBUTION.md`](ATTRIBUTION.md).
