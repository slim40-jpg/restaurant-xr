/**
 * @file    src/interaction/auth.mjs
 * @brief   Authentification Supabase.
 * @author  Wassim Hajji
 * @date    2026-11-25
 * @role    Enveloppe les appels supabase.auth.
 */

import { supabase } from '../core/supabase-client.mjs';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role ?? 'client';
}