// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for build-time safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase client (using anon key)
export const supabaseClient = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client (using service role key)
export const supabaseService = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Utility function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
}

// Utility function to get the service client with error handling
export function getSupabaseService() {
  if (!supabaseService) {
    throw new Error(
      'Supabase service client not configured. Please check environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return supabaseService;
}

// Utility function to get the client with error handling
export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error(
      'Supabase client not configured. Please check environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return supabaseClient;
}