# PWA — installation, hors-ligne et vérification

L'application est une **Progressive Web App** : elle s'installe depuis le navigateur, se lance
en plein écran comme une application native et continue de fonctionner sans réseau après la
première visite.

## 1. Ce qui rend l'application installable

Les critères réellement vérifiés par les navigateurs :

| Critère | Implémentation |
| --- | --- |
| Contexte sécurisé | HTTPS ou `localhost` (`python -m http.server 8000`) |
| Manifeste lié au document | `<link rel="manifest" href="./manifest.webmanifest" />` dans `index.html` |
| Nom | `name` et `short_name` renseignés |
| Point d'entrée et périmètre | `start_url: "./"` et `scope: "./"` — relatifs, donc valides en sous-chemin |
| Mode d'affichage | `display: "standalone"`, avec `display_override` |
| Icônes | 192×192, 512×512 et 512×512 `maskable` dans `icons/` |
| Service worker | `sw.js` enregistré par `src/core/pwa.js` avec au moins un gestionnaire `fetch` |
| Couleurs | `background_color` et `theme_color` = `#0d0d16` |

> Le service worker et le manifeste ne prennent effet que si `src/core/pwa.js` est appelé au
> démarrage (`registerServiceWorker()`) et si le manifeste est bien lié dans `index.html`.
> Ces deux branchements sont hors du périmètre de ce module et doivent être vérifiés à
> l'intégration.

## 2. Installer l'application

### Desktop — Chrome / Edge

1. Servir l'application en local : `python -m http.server 8000`, puis ouvrir
   `http://localhost:8000/`.
2. Attendre le chargement complet (le service worker s'installe après l'événement `load`).
3. Cliquer sur l'icône d'installation dans la barre d'adresse, ou ouvrir le menu
   **⋮ → Installer Restaurant XR** / **Applications → Installer ce site**.
4. L'application s'ouvre dans sa propre fenêtre, sans barre d'adresse.

### Android — Chrome

1. Ouvrir l'URL HTTPS de l'application.
2. Menu **⋮ → Ajouter à l'écran d'accueil** (ou la bannière d'installation si elle apparaît).
3. Confirmer : l'icône maskable est utilisée pour le lanceur.

### Casque Meta Quest — navigateur Meta Quest

1. Ouvrir l'URL HTTPS dans le navigateur du casque.
2. Menu du navigateur → **Installer** / **Ajouter à l'accueil**.
3. Lancer l'application depuis la bibliothèque du casque, puis entrer en session immersive
   avec le bouton **VR** de l'application.

## 3. Vérifier le fonctionnement hors-ligne

1. Charger l'application une première fois **avec réseau** et attendre la fin de
   l'installation du service worker (onglet **Application → Service workers** : état
   *activated*).
2. Naviguer dans la salle et réserver une table une fois, pour confirmer que tout fonctionne
   en ligne.
3. Passer hors-ligne : cocher **Offline** dans l'onglet **Network** des DevTools, ou couper
   le Wi-Fi de l'appareil.
4. Recharger la page (F5 / tirer pour rafraîchir).
   - Attendu : l'application se charge normalement depuis le cache (coque, modules locaux et
     modules Three.js épinglés).
   - Si la coque n'est pas en cache : la page `offline.html` s'affiche avec le bouton
     **Réessayer**.
5. Vérifier que la réservation et le choix de table restent utilisables hors-ligne.
6. Revenir en ligne et recharger : la version réseau reprend la main.

## 4. Auditer l'installation

- **Lighthouse** (DevTools → Lighthouse) : cocher *Progressive Web App* / *Installability*,
  générer le rapport et vérifier l'absence d'erreur bloquante.
- **Application → Manifest** : le manifeste doit être lu sans erreur, avec les trois icônes
  et `display: standalone`.
- **Application → Service workers** : le worker `sw.js` doit être *activated and is running*,
  avec la case *Update on reload* pour les tests.
- **Application → Cache Storage** : le cache `restaurant-xr-v1` doit contenir la coque et les
  modules CDN.

## 5. Ce qui n'est pas garanti

- **Première visite hors-ligne** : impossible. Le service worker ne peut se installer et
  pré-cacher les fichiers qu'après un premier chargement en ligne.
- **Modules CDN si le réseau les bloque dès l'installation** : le pré-cache utilise
  `Promise.allSettled`, donc un module CDN inaccessible n'empêche pas l'installation, mais
  l'application ne pourra pas démarrer hors-ligne tant que ces modules n'auront pas été mis en
  cache lors d'une visite en ligne ultérieure.
- **Fichiers absents au moment de l'installation** : ils sont simplement ignorés (même
  mécanisme `allSettled`) et ne seront mis en cache qu'à leur première requête réussie.

## 6. Mettre à jour l'application

1. Modifier les fichiers de l'application.
2. Incrémenter `VERSION` dans `sw.js` (par exemple `restaurant-xr-v2`). C'est ce changement
   qui déclenche le cycle d'installation du nouveau worker et la purge des anciens caches à
   l'activation.
3. Recharger l'application : le nouveau worker s'installe, puis la bannière
   « Une nouvelle version est disponible — Recharger » apparaît si un contrôleur existait.
4. Cliquer sur la bannière : la page recharge et sert la nouvelle version.
5. Vérifier dans **Application → Cache Storage** que seul le cache de la nouvelle `VERSION`
   subsiste.

> Les modules Three.js restent épinglés à `0.187.0` (`THREE_VERSION`). Une montée de version
> de Three.js exige de mettre à jour l'import map de `index.html`, `THREE_VERSION` dans
> `sw.js` et, si nécessaire, la liste des modules CDN pré-cachés.
