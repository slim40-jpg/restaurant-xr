// @file auth.mjs
// @author Wassim Hajji
// @date 2026-11-25
// @role Authentication helpers

import { supabase } from '../core/supabase-client.mjs';

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error };

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
    });
  }

  return { user: data.user };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data?.user, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? 'client';
}