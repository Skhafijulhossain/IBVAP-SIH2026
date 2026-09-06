import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Validates if real Supabase credentials have been configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawUrl &&
    rawKey &&
    rawUrl.startsWith('http') &&
    !rawUrl.includes('placeholder') &&
    !rawUrl.includes('your-supabase-url')
  );
};

// Safe fallback for offline development / test builds
const supabaseUrl = isSupabaseConfigured() ? rawUrl : 'https://ibvap-mock.supabase.co';
const supabaseAnonKey = isSupabaseConfigured() ? rawKey : 'ibvap-mock-anon-key-placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
