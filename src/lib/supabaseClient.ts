import { createClient } from '@supabase/supabase-js';

// --- Supabase Configuration for Cloudflare Worker Deployment ---
// These values are hardcoded to avoid Cloudflare Worker environment variable restrictions.
// This is safe for frontend use because it only uses the anon public key, 
// which is designed to be exposed in the client-side code.

const supabaseUrl = 'https://qhkftofvpxckhayqhkpx.supabase.co';
const supabaseAnonKey = '<Your Supabase Publishable Key>';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
