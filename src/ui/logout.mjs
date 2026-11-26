/**
 * @file    src/ui/logout-button.mjs
 * @brief   Bouton de déconnexion.
 * @author  Hazem Bellili
 * @date    2026-11-25
 * @role    Affiche un bouton et déconnecte l'utilisateur.
 */

import { signOut } from '../interaction/auth.mjs';

export function createLogoutButton(container) {
  const btn = document.createElement('button');
  btn.textContent = 'Déconnexion';
  btn.style.cssText = `
    position: fixed; top: 18px; right: 18px; z-index: 1000;
    padding: 8px 16px; background: #ef4444; color: white;
    border: none; border-radius: 6px; cursor: pointer;
    font-weight: bold; font-family: system-ui, sans-serif;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  `;
  
  btn.addEventListener('click', async () => {
    btn.textContent = '...';
    btn.disabled = true;
    await signOut();
    // Reload the page to reset the 3D scene and show the login form
    window.location.reload();
  });

  container.appendChild(btn);
  return btn;
}