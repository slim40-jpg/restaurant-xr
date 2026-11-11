# Planning du projet — Restaurant XR

| Champ | Valeur |
| --- | --- |
| Version | 0.1.0 |
| Jalon courant | W1 — Socle d'ingénierie logicielle (terminé) |
| Dernière mise à jour | 2026-11-10 |
| Équipe | Slim Selmi · Hazem Bellili · Wassim Hajji |

---

## 1. Objectif et méthode

**Objectif** : faire passer le projet du statut de prototype (« profil Hackathon »)
à celui d'un produit logiciel structuré, vérifiable et démontrable chaque semaine.

**Méthode** — un jalon = une semaine = une branche = une Pull Request = une démo :

1. La branche est créée depuis `main` protégée.
2. Le travail est découpé en commits conventionnels (≥ 6 par semaine).
3. La PR documente *quoi / pourquoi / comment vérifié* (commande + résultat).
4. La revue est assurée par un autre membre (voir `CODEOWNERS`).
5. La fusion est conditionnée à `npm run verify` vert.
6. La preuve hebdomadaire est consignée dans `docs/DEMO_LOG.md`.

### Definition of Done (commune à tous les jalons)

- [ ] Le code compile/s'exécute sans erreur console.
- [ ] `npm run verify` passe.
- [ ] Chaque nouveau module possède son en-tête (`@file`, `@author`, `@date`, `@role`) et sa JSDoc.
- [ ] La documentation concernée est mise à jour **dans la même PR**.
- [ ] Une preuve vérifiable est archivée (capture, sortie de commande, URL déployée).
- [ ] La PR est relue par un second membre.

---

## 2. Vue d'ensemble des 6 semaines

W1 et W2 ont été livrés en avance (10 et 11 novembre 2026). Le calendrier ci-dessous
compte donc les **quatre semaines restantes** : `S+1` à `S+4`.

| Jalon | Quand | Thème | Réponse au retour du jury | Livrable de démonstration |
| --- | --- | --- | --- | --- |
| W1 | livré | Socle d'ingénierie | « Structurer le code », « dossier /docs », « en-têtes et commentaires », « 5 commits » | `/docs` complet, code modulaire, historique Git structuré |
| W2 | livré | Modernisation du rendu | « Three.js r160 obsolète, pas de WebGPU » | r187 + `WebGPURenderer` avec repli WebGL2, badge de backend |
| W3 | S+1 | Produit réaliste | Salle crédible, choix de place | 16 tables sur 5 zones, couverts, moteur de préférences |
| W4 | S+2 | PWA et téléportation | « Pas de PWA », téléportation (demandée nommément) | Application installable + déplacement au joystick |
| W5 | S+3 | Backend (1/2) : persistance | Backend multi-utilisateur (demandé nommément) | Réservations persistées, conflit refusé en `409` |
| W6 | S+4 | Backend (2/2) : temps réel, CI, release | Backend multi-utilisateur (demandé nommément) | Deux clients synchronisés + CI verte + `v1.0.0` |

---

## 3. Détail des jalons

### W1 — Socle d'ingénierie logicielle ✅

**Livrables**

- `src/` modulaire : 10 modules, aucun fichier > 200 lignes, `main.js` ≤ 60 lignes.
- En-têtes réglementaires (`@file`, `@author`, `@date`, `@role`) et JSDoc sur chaque fonction exportée.
- Outillage : `package.json`, ESLint (flat config), Prettier, vérificateur d'en-têtes.
- Documentation : `docs/technical_specs.md`, `docs/PLANNING.md`, `docs/ARCHITECTURE.md`, 2 ADR, `docs/DEMO_LOG.md`.
- `README.md` réécrit : il ne décrit plus que des fonctionnalités réellement présentes.
- Hygiène : `.gitignore`, `.gitattributes` (LFS pour `*.glb`), `LICENSE`, `CONTRIBUTING.md`, `CODEOWNERS`.

**Critères d'acceptation**

| Critère | Vérification |
| --- | --- |
| En-têtes présents partout | `npm run check:headers` → 0 échec |
| Lint | `npm run lint` → 0 erreur |
| Format | `npm run format:check` → 0 écart |
| Comportement inchangé | Recette manuelle §10 de `technical_specs.md` |
| Documentation alignée sur le code | Aucune fonctionnalité annoncée absente du code |

---

### W2 — Three.js r187 + WebGPU ✅

> Ce jalon a absorbé deux éléments initialement prévus en W4, parce qu'ils
> conditionnent la démonstration : l'usage **sans casque** (orbite + clic) et le
> panneau de statut **lisible en VR** (DT-03). Le W4 ne conserve donc que la
> téléportation et l'intégration des modèles GLB.

**Livrables**

- `package.json` : `three@0.187.0` installé localement, import map supprimée.
- `WebGPURenderer` (`three/webgpu`) + repli officiel `WebGLXRFallback`
  (`three/addons/webxr/WebGLXRFallback.js`), `XRButton` avec `optionalFeatures: ['webgpu']`.
- `renderer.xr.enabled = true` **avant** initialisation (adaptateur `xrCompatible`).
- Remplacement de `PCFSoftShadowMap` par `PCFShadowMap` (supprimé en r185/r186).
- Réétalonnage de l'éclairage (suppression de `useLegacyLights` en r165, changements
  énergétiques en r181).
- `docs/MIGRATION_R160_R187.md` : tableau des changements, preuves avant/après.
- Badge de backend affiché dans l'interface (`WebGPU` / `WebGL2 fallback`).

**Décision d'architecture (à défendre devant le jury)**

`WebGPURenderer` est la cible demandée, mais **WebXR sur WebGPU reste expérimental
en novembre 2026** : il exige la fonctionnalité de session `webgpu` et l'interface
`XRGPUBinding`, et **le multiview n'y est pas supporté**. Le repli WebGL2 est donc
une exigence de robustesse, pas un aveu d'échec : sans lui, la majorité des casques
affichent un écran noir.

**Critères d'acceptation**

- `npm ls three` → `0.187.0`.
- Aucun avertissement d'API supprimée en console.
- La session VR fonctionne sur Quest (repli WebGL2 accepté) et sur Chrome desktop.
- Le badge reflète le backend réellement utilisé.

**Risque principal** : régression visuelle (ombres, intensités). Mitigation : capture
avant/après archivée dans `docs/img/`.

---

### W3 — PWA, hors-ligne et déploiement

**Livrables**

- `manifest.webmanifest` : `name`, `short_name`, `start_url`, `scope`,
  `display: standalone`, `display_override`, icônes 192, 512 et 512 *maskable*.
- `sw.js` : pré-cache de la coque applicative, **network-first pour le HTML**
  (sinon un changement de version n'atteint jamais l'utilisateur), cache-first pour
  les modules Three.js épinglés, *stale-while-revalidate* pour les ressources locales,
  `skipWaiting()` et purge des anciens caches à l'`activate`.
- Page de repli hors-ligne, prompt d'installation, notification de mise à jour.
- Déploiement HTTPS (GitHub Pages ou Netlify) + URL dans le README.
- `docs/PWA.md` avec le rapport Lighthouse.

**Critères d'acceptation**

- Audit Lighthouse « Installable » sans erreur.
- Rechargement hors-ligne fonctionnel (capture archivée).
- Installation effective sur desktop et Android.

---

### W4 — Téléportation et immersion utilisable

> Exigence nommée par le jury : *« feuille de route pour la téléportation »*.

**Objectif** : permettre de se déplacer dans le restaurant sans provoquer de
cinétose, et rendre le retour d'état lisible dans le casque.

**Spécification de la téléportation**

| Élément | Décision |
| --- | --- |
| Espace de référence | `local-floor` (la hauteur réelle de l'utilisateur est respectée) |
| Entrée | Joystick de la manette gauche, axe `gamepad.axes[3]` / `[2]`, zone morte 0,15 |
| Visée | Arc parabolique projeté sur le sol, résolu par `Raycaster` sur le maillage `floor` |
| Validation | Relâchement du joystick → téléportation ; annulation en ramenant le stick au centre |
| Retour visuel | Anneau au point d'atterrissage + fondu noir 120 ms (confort) |
| Rotation | *Snap turn* de 30° sur l'axe horizontal, sans rotation continue |
| Garde-fous | Pas de téléportation hors des murs ni dans une table (rayon de dégagement 0,6 m) |
| Fichiers | `src/xr/locomotion.js`, `src/interaction/teleport.js`, `src/world/navigation.js` |
| Tests | Calcul du point d'atterrissage, rejet hors-limites, zone morte (Vitest) |

**Autres livrables**

- Machine à états explicite de la réservation : `IDLE → TARGETING → CONFIRMING → CONFIRMED`,
  avec annulation (aujourd'hui : transition directe au clic).
- **Dolly joueur** : regrouper caméra et déplacement dans un `THREE.Group` parent, pour que
  la téléportation survive au remplacement du renderer par `WebGLXRFallback`.
- Intégration des modèles GLB de `assets/` (après compression et vérification DT-08).
- `docs/adr/0003-teleportation.md`.
- **Vitest** : `npm run test` intégré à `npm run verify` (lève DT-09).

**Critères d'acceptation**

- Téléportation fluide sur Quest et sur l'émulateur.
- Aucune téléportation hors zone autorisée, ni dans une table.
- `npm run test` vert et intégré à `npm run verify`.
- Le déplacement survit à l'ouverture puis à la fermeture d'une session XR.

---

### W5 — Backend (1/2) : persistance, API et conflits

> Exigence nommée par le jury : *« backend multi-utilisateur »*. Elle est traitée sur
> deux semaines : W5 pour l'état persistant, W6 pour le temps réel et la mise en service.

**Prérequis bloquant (jour 1)**

Les identifiants de table sont actuellement dérivés de la position
(`Table_-3_-3`) : ils ne peuvent pas servir de clé primaire. Passer à des
identifiants stables `T01`…`T06` dans `config/constants.js` **avant** d'écrire la
moindre migration (dette DT-05). Sans cela, un changement de plan invalide toutes
les réservations.

**Livrables**

- Backend + schéma migré (Alembic), `docker-compose.yml` pour PostgreSQL.
- `GET /tables`, `POST /reservations`, `DELETE /reservations/:id`.
- `src/net/api.js` : chargement initial, réservation optimiste, rollback sur `409`.
- `docs/adr/0004-backend.md`, `docs/API.md`.

**Choix technique à arbitrer (ADR-0004) en début de semaine**

| Option | Avantages | Inconvénients | Verdict |
| --- | --- | --- | --- |
| **Supabase** (PostgreSQL + Realtime + RLS) | Temps de mise en œuvre minimal, temps réel natif, RLS intégrée, hébergement gratuit | Dépendance externe, moins de code « maison » à montrer | **Recommandé** si le délai est serré |
| **Node (Fastify) + `ws` + PostgreSQL** | Contrôle total, démontre l'ingénierie backend, cohérent avec le profil de l'équipe | Plus de code, plus de surface d'erreur | Recommandé si la semaine le permet |
| Firebase | Rapide | Modèle NoSQL moins démonstratif pour un cours de bases de données | Écarté |

**Modèle de données**

```sql
create table tables (
  id          text primary key,           -- 'T01' … 'T16', stable, issu de world/layout.js
  capacity    smallint not null check (capacity in (2, 4, 6)),
  zone        text not null check (zone in ('window','corner','center','bar','banquette')),
  features    text[] not null default '{}',  -- quiet | private | view | near_wc | near_entrance
  status      text not null check (status in ('available','occupied','reserved','unavailable')),
  updated_at  timestamptz not null default now()
);

create table reservations (
  id          uuid primary key default gen_random_uuid(),
  table_id    text not null references tables(id),
  label       text not null,
  status      text not null default 'confirmed' check (status in ('confirmed','cancelled','seated')),
  created_at  timestamptz not null default now()
);

-- Invariant : au plus une réservation active par table
create unique index one_active_reservation_per_table
  on reservations (table_id) where (status = 'confirmed');
```

**API et protocole**

| Type | Route / événement | Rôle |
| --- | --- | --- |
| REST | `GET /tables` | État initial de toutes les tables |
| REST | `POST /reservations` | Créer une réservation → `201`, ou `409 TABLE_ALREADY_RESERVED` |
| REST | `DELETE /reservations/:id` | Annuler → libère la table |
| WS | `table.updated` | Diffusion de l'état après chaque transition |
| WS | `reservation.rejected` | Notification au client dont la réservation a échoué |

**Gestion de conflit (le point qui prouve que le backend est réel)**

1. Le client applique la réservation de façon optimiste (retour immédiat, confort VR).
2. Le serveur valide dans une transaction ; l'index unique partiel rejette le doublon.
3. En cas de `409`, le client **annule** son changement optimiste, restaure l'état
   serveur et affiche un message explicite.
4. Reconnexion : backoff exponentiel, puis resynchronisation complète via `GET /tables`.

**Critères d'acceptation (W5)**

- `POST /reservations` renvoie `409 TABLE_ALREADY_RESERVED` sur une table déjà réservée
  (garanti par l'index unique partiel, pas par un `if` applicatif).
- Une réservation survit à un rechargement de page.
- Sur `409`, le client annule son changement optimiste et restaure l'état serveur.
- `docs/API.md` publié ; documentation OpenAPI accessible depuis le backend.

---

### W6 — Backend (2/2) : temps réel, CI/CD et release

**Livrables**

- Diffusion WebSocket `table.updated` après chaque transition, à tous les clients.
- Client : reconnexion avec backoff exponentiel et resynchronisation via `GET /tables`.
- `reservation.rejected` : notification ciblée du client perdant.
- GitHub Actions : `check:headers` → `lint` → `test` → `deploy`, requis sur chaque PR.
- `docs/SOUTENANCE.md` : script de 2 minutes, questions anticipées, architecture en une image.
- Tag `v1.0.0` + *Release* GitHub avec vidéo de démonstration.

**Critères d'acceptation (W6)**

- Deux navigateurs, même table : le second reçoit un refus en < 500 ms et revient en arrière.
- Une réservation faite dans un onglet apparaît dans l'autre en < 500 ms, sans rechargement.
- CI verte sur `main`, badge CI dans le README.
- Release `v1.0.0` publiée avec la vidéo.

---

## 4. Risques et parades

| Risque | Probabilité | Impact | Parade |
| --- | --- | --- | --- |
| WebGPU+WebXR instable sur le casque de démonstration | Élevée | Élevé | Repli WebGL2 activé par défaut, testé sur le casque **avant** la démo |
| Semaine 5 trop chargée (backend + CI + docs) | Moyenne | Élevé | Backend minimal d'abord ; l'offline avancé est sacrifiable, pas la CI |
| Un seul compte GitHub apparaît dans l'historique | Moyenne | Élevé (note « gestion de projet ») | Chaque membre commite son périmètre avec sa propre identité |
| Régression visuelle après migration r187 | Moyenne | Moyen | Captures avant/après, réétalonnage documenté |
| Modèles GLB lourds non optimisés (30 Mo) | Certaine | Moyen | LFS en W1, compression/Draco en W4 |
| Licence des assets non confirmée | Certaine | Moyen | Vérification manuelle avant W2 (dette DT-08) |
| Perte de travail locale | Faible | Élevé | PR hebdomadaires, `main` protégée, tags par jalon |

---

## 5. Suivi

| Jalon | Branche | État | PR | Démo |
| --- | --- | --- | --- | --- |
| W1 | `chore/engineering-baseline` | ✅ terminé | à ouvrir | `/docs` + historique Git |
| W2 | `feat/three-r187` | ✅ terminé | à ouvrir | badge backend + sélection souris + panneau 3D |
| W3 | `feat/pwa` | ⬜ | — | installation + hors-ligne |
| W4 | `feat/teleportation` | ⬜ | — | déplacement en VR + `npm run test` |
| W5 | `feat/backend-persistence` | ⬜ | — | `409` sur conflit, données persistées |
| W6 | `feat/realtime-ci` | ⬜ | — | deux clients synchronisés + `v1.0.0` |

---

## 6. Après le cours (backlog)

- Reconnaissance des mains (WebXR Hand Input).
- Audio spatialisé (`THREE.PositionalAudio`).
- Avatars des autres clients en session partagée.
- Mode administrateur (plan de salle, ouverture/fermeture).
- Accessibilité : taille de texte, contraste, alternatives au pointage.
- Optimisation : compression Draco/KTX2, découpage des bundles.
- Observabilité : suivi d'erreurs et mesures de performance en production.
