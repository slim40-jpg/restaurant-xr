/**
 * @file    src/core/supabase-client.mjs
 * @brief   Client Supabase (URL + clé publishable).
 * @author  Wassim Hajji
 * @date    2026-11-25
 * @role    Expose une instance unique du client Supabase.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  'https://udhmsddfhuobakrnwqun.supabase.co',
  'sb_publishable_m0mITa-lwWwwLgVXgNk-Yg_U_kmVVu2'
);