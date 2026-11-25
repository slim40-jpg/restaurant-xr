// @file auth-panel.mjs
// @author Hazem Bellili
// @date 2026-11-25
// @role Login / signup panel

import { signIn, signUp } from '../interaction/auth.mjs';

export function renderAuthPanel(container, onSuccess) {
  container.innerHTML = `
    <div class="auth-panel">
      <h2>Connexion</h2>
      <input id="auth-email" type="email" placeholder="Email" />
      <input id="auth-password" type="password" placeholder="Mot de passe" />
      <input id="auth-name" type="text" placeholder="Nom complet (inscription)" />
      <button id="auth-signin">Se connecter</button>
      <button id="auth-signup">Créer un compte</button>
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

  container.querySelector('#auth-signup').addEventListener('click', async () => {
    const email = container.querySelector('#auth-email').value;
    const password = container.querySelector('#auth-password').value;
    const name = container.querySelector('#auth-name').value;
    const { user, error } = await signUp(email, password, name);
    if (error) {
      container.querySelector('#auth-error').textContent = error.message;
    } else if (user) {
      onSuccess(user);
    }
  });
}