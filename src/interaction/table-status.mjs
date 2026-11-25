/**
 * @file    src/interaction/table-status.mjs
 * @brief   Calcule l'état visuel d'une table (free / reserved / occupied).
 * @author  Wassim Hajji
 * @date    2026-11-25
 * @role    Source unique de vérité pour les trois états.
 */

import { supabase } from '../core/supabase-client.mjs';

export function computeTableStates(rows) {
  const states = new Map();
  for (const r of rows) {
    const prev = states.get(r.table_id) ?? 'free';
    if (r.status === 'occupied') states.set(r.table_id, 'occupied');
    else if (r.status === 'confirmed' && prev !== 'occupied') states.set(r.table_id, 'reserved');
  }
  return states;
}

export async function fetchTableStates() {
  const { data, error } = await supabase
    .from('reservations')
    .select('table_id, status')
    .in('status', ['confirmed', 'occupied']);

  if (error) {
    console.error('Failed to fetch table states:', error);
    return new Map();
  }
  return computeTableStates(data);
}