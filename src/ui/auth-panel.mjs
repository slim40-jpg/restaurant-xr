/**
 * @file    src/ui/auth-panel.mjs
 * @brief   Panneau de connexion / inscription.
 * @author  Hazem Bellili
 * @date    2026-11-25
 * @role    Affiche le formulaire et délègue à interaction/auth.mjs.
 */

import { signIn} from '../interaction/auth.mjs';

export function renderAuthPanel(container, onSuccess) {
  container.innerHTML = `
    <div class="auth-panel">
      <h2>Restaurant XR</h2>
      <input id="auth-email" type="email" placeholder="Email" />
      <input id="auth-password" type="password" placeholder="Mot de passe" />
      <button id="auth-signin">Se connecter</button>
      <p id="auth-error"></p>
    </div>
  `;

  container.querySelector('#auth-signin').addEventListener('click', async () => {
    const email = container.querySelector('#auth-email').value;
    const password = container.querySelector('#auth-password').value;
    const { user, error } = await signIn(email, password);
    
    if (error) {
      container.querySelector('#auth-error').textContent = error.message;
    } else if (user) {
      onSuccess(user);
    }
  });
}