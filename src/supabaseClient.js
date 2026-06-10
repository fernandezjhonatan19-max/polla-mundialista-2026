import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL');

// Log the status of Supabase configuration
if (hasSupabase) {
  console.log('🔌 Connected to Supabase Cloud Database');
} else {
  console.warn('⚠️ Supabase credentials not found. Running in Offline Demo Mode (local storage fallback).');
}

export const supabase = hasSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
