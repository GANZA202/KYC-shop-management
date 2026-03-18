import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the configuration is missing or using placeholder values
export const isSupabaseConfigured = !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-url' && 
  !supabaseUrl.includes('placeholder');

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ SUPABASE CONFIGURATION MISSING: Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
