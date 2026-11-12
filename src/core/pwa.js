/**
 * @file    src/core/pwa.js
 * @brief   Enregistre le service worker et signale les mises à jour disponibles.
 * @author  Hazem Bellili — Intégration assets / UI /
 * @date    2026-11-11
 * @role    Couche PWA côté client : enregistrement du worker, bannière de mise à jour.
 */

const BANNER_ID = 'pwa-update-banner';

const BANNER_STYLE = {
  position: 'fixed',
  left: '50%',
  bottom: '24px',
  transform: 'translateX(-50%)',
  zIndex: '1000',
  padding: '10px 18px',
  border: '1px solid rgba(255, 255, 255, 0.28)',
  borderRadius: '999px',
  background: 'rgba(13, 13, 22, 0.92)',
  color: '#fff',
  font: '500 14px/1.3 system-ui, sans-serif',
  cursor: 'pointer',
  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
};

// Un seul avertissement en console : un échec d'enregistrement ne doit pas
// polluer la console à chaque chargement, ni être visible par l'utilisateur.
let hasWarned = false;

/**
 * Affiche une notification discrète invitant à recharger pour activer la nouvelle version.
 * @returns {void}
 */
function showUpdateBanner() {
  if (document.getElementById(BANNER_ID)) {
    return;
  }

  const banner = document.createElement('button');
  banner.id = BANNER_ID;
  banner.type = 'button';
  banner.textContent = 'Une nouvelle version est disponible — Recharger';
  Object.assign(banner.style, BANNER_STYLE);
  banner.addEventListener('click', () => window.location.reload());
  document.body.appendChild(banner);
}

/**
 * Surveille l'installation d'un nouveau worker et notifie seulement si un contrôleur existait.
 * @param {ServiceWorkerRegistration} registration Enregistrement retourné par `register`.
 * @returns {void}
 */
function watchForUpdates(registration) {
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) {
      return;
    }

    installing.addEventListener('statechange', () => {
      // `controller` non nul = mise à jour d'une application déjà installée.
      if (installing.state === 'activated' && navigator.serviceWorker.controller) {
        showUpdateBanner();
      }
    });
  });
}

/**
 * Trace l'échec d'enregistrement une seule fois, sans jamais interrompre l'application.
 * @param {unknown} error Erreur remontée par l'enregistrement du worker.
 * @returns {void}
 */
function warnOnce(error) {
  if (hasWarned) {
    return;
  }
  hasWarned = true;
  console.warn('Service worker indisponible :', error);
}

/**
 * Enregistre `./sw.js` après le chargement de la page, si le contexte le permet.
 * @returns {void}
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(watchForUpdates).catch(warnOnce);
  });
}
