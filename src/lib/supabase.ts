import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables with backward compatibility for ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  ''
);

export const STORAGE_BUCKET = 'person-photos';
export const TABLE_PEOPLE = 'people';

/**
 * Checks whether Supabase has valid runtime URL and publishable credentials.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseKey) return false;
  if (supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) return false;
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) return false;
  return true;
}

/**
 * Singleton Supabase client instance.
 * Safe fallback client created if unconfigured to prevent module-load crashes.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
