// @file supabase-client.mjs
// @author Slim Selmi
// @date 2026-11-25
// @role Supabase client initialization

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://udhmsddfhuobakrnwqun.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_m0mITa-lwWwwLgVXgNk-Yg_U_kmVVu2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);