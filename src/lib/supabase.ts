import { createClient } from '@supabase/supabase-js';

// --- Supabase Configuration for Cloudflare Worker Deployment ---
// These values are hardcoded to avoid Cloudflare Worker environment variable restrictions.
// This is safe for frontend use because it only uses the anon public key.

const supabaseUrl = 'https://qhkftofvpxckhayqhkpx.supabase.co';
const supabaseAnonKey = '<Your Supabase Publishable Key>';

export const isSupabaseConfigured = (supabaseUrl as string) !== 'https://placeholder-url.supabase.co' && 
  (supabaseAnonKey as string) !== '<Your Supabase Publishable Key>';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
