/**
 * @file    sw.js
 * @brief   Service worker : pré-cache de la coque, repli hors-ligne et stratégies de récupération.
 * @author  Hazem Bellili — Intégration assets / UI /
 * @date    2026-11-11
 * @role    Rendre l'application installable et utilisable sans réseau (worker classique, non module).
 */

const VERSION = 'restaurant-xr-v1';
const THREE_VERSION = '0.187.0';
const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/`;

// Chemins relatifs : le pré-cache reste valide si l'application est servie depuis
// un sous-chemin (GitHub Pages, Netlify avec base path, etc.).
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './src/main.js',
  './src/config/constants.js',
  './src/core/renderer.js',
  './src/core/scene.js',
  './src/core/pwa.js',
  './src/world/layout.js',
  './src/world/environment.js',
  './src/world/props.js',
  './src/world/furniture.js',
  './src/world/restaurant.js',
  './src/world/tableware.js',
  './src/xr/ar.js',
  './src/xr/ar-hint.js',
  './src/xr/ar-reticle.js',
  './src/xr/controllers.js',
  './src/interaction/selection.js',
  './src/interaction/pointer.js',
  './src/interaction/controls.js',
  './src/interaction/recommend.js',
  './src/interaction/highlight.js',
  './src/ui/status-panel.js',
  './src/ui/status-panel-3d.js',
  './src/ui/status-fanout.js',
  './src/ui/backend-badge.js',
  './src/ui/webgpu-gate.js',
  './src/ui/preferences.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  `${CDN_PREFIX}build/three.webgpu.js`,
  `${CDN_PREFIX}build/three.core.js`,
  `${CDN_PREFIX}build/three.tsl.js`,
  `${CDN_PREFIX}examples/jsm/webxr/ARButton.js`,
  `${CDN_PREFIX}examples/jsm/webxr/VRButton.js`,
  `${CDN_PREFIX}examples/jsm/webxr/XRControllerModelFactory.js`,
  `${CDN_PREFIX}examples/jsm/controls/OrbitControls.js`,
];

/**
 * Sert une navigation : le réseau d'abord, puis la coque en cache, puis la page hors-ligne.
 * Le réseau d'abord est indispensable ici, sinon une nouvelle version du HTML
 * n'atteindrait jamais un utilisateur déjà installé.
 * @param {Request} request Requête de navigation.
 * @returns {Promise<Response>} Réponse réseau, coque en cache, ou page de repli.
 */
async function networkFirst(request) {
  const cache = await self.caches.open(VERSION);

  try {
    const response = await self.fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const direct = await cache.match(request);
    if (direct) {
      return direct;
    }
    return (
      (await cache.match('./index.html')) || (await cache.match('./offline.html')) || self.Response.error()
    );
  }
}

/**
 * Sert un fichier local : la version en cache immédiatement, puis rafraîchit en arrière-plan.
 * @param {Request} request Requête de même origine.
 * @returns {Promise<Response>} Réponse en cache si disponible, sinon réponse réseau.
 */
async function staleWhileRevalidate(request) {
  const cache = await self.caches.open(VERSION);
  const cached = await cache.match(request);

  const network = self
    .fetch(request)
    .then((response) => {
      if (!response.ok) {
        return response;
      }
      return cache.put(request, response.clone()).then(() => response);
    })
    .catch(() => cached || self.Response.error());

  return cached || network;
}

/**
 * Sert un module CDN épinglé : le cache d'abord, car l'URL est immuable pour une version donnée.
 * @param {Request} request Requête vers le CDN Three.js.
 * @returns {Promise<Response>} Réponse en cache ou réponse réseau mise en cache.
 */
async function cacheFirst(request) {
  const cache = await self.caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await self.fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  // allSettled : un asset manquant (icône, module optionnel) ne doit pas annuler
  // l'installation, sinon l'application n'est jamais installable.
  event.waitUntil(
    self.caches
      .open(VERSION)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== VERSION).map((name) => self.caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Les écritures ne passent jamais par le cache : une réservation doit toujours
  // atteindre le réseau ou échouer explicitement.
  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.url.startsWith(CDN_PREFIX)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.url.startsWith(self.location.origin)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
