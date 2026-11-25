// @file reserve.mjs
// @author Wassim Hajji
// @date 2026-11-25
// @role Reservation business logic with Supabase backend

import { supabase } from '../core/supabase-client.mjs';

export async function reserve(tableId) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Vous devez être connecté pour réserver.' };
  }

  // Check if table is already reserved (defensive check)
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (existing) {
    return { error: 'Cette table est déjà réservée.' };
  }

  const { error } = await supabase
    .from('reservations')
    .insert({
      table_id: tableId,
      user_id: user.id,
      guest_name: user.email,
    });

  if (error) {
    console.error('Reservation failed:', error);
    return { error: 'La réservation a échoué. Réessayez.' };
  }

  return { success: true };
}

export async function getReservedTableIds() {
  const { data, error } = await supabase
    .from('reservations')
    .select('table_id')
    .eq('status', 'confirmed');

  if (error) {
    console.error('Failed to fetch reservations:', error);
    return new Set();
  }

  return new Set(data.map((r) => r.table_id));
}