// @file realtime.mjs
// @author Slim Selmi
// @date 2026-11-25
// @role Realtime subscription for reservation changes

import { supabase } from './supabase-client.mjs';

let channel = null;
export function subscribeToReservations(onChange) {
  channel = supabase
    .channel('reservations-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      (payload) => {
        onChange({
          eventType: payload.eventType,
          tableId: payload.new?.table_id ?? payload.old?.table_id,
          status: payload.new?.status,        // 'confirmed' | 'cancelled' | 'occupied'
        });
      }
    )
    .subscribe();
}

export function unsubscribeFromReservations() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}