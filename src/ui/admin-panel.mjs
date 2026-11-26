// @file admin-panel.mjs
// @author Hazem Bellili
// @date 2026-11-25
// @role Admin reservation history view

import { supabase } from '../core/supabase-client.mjs';
import { getUserRole } from '../interaction/auth.mjs';

export async function renderAdminPanel(container, userId) {
  const role = await getUserRole(userId);
  if (role !== 'admin') {
    container.innerHTML = '<p>Accès refusé.</p>';
    return;
  }

  const { data: history, error } = await supabase
    .from('reservations')
    .select(`
      id,
      created_at,
      status,
      guest_name,
      tables ( zone, capacity ),
      profiles ( full_name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p>Erreur : ${error.message}</p>`;
    return;
  }

  container.innerHTML = `
    <div class="admin-panel">
      <h2>Historique des réservations</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Table</th>
            <th>Zone</th>
            <th>Client</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${history.map((r) => `
            <tr>
              <td>${new Date(r.created_at).toLocaleString('fr-FR')}</td>
              <td>${r.tables?.zone ?? '—'}</td>
              <td>${r.tables?.capacity ?? '—'} pers.</td>
              <td>${r.profiles?.full_name ?? r.guest_name ?? '—'}</td> 
<td class="status-${r.status === 'confirmed' ? 'reserved' : r.status === 'occupied' ? 'occupied' : 'free'}">
  ${r.status}
</td>            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}