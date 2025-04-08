import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Clear any potentially corrupted tokens
try {
  const currentSession = localStorage.getItem('playground-finder-auth');
  if (currentSession) {
    const session = JSON.parse(currentSession);
    if (!session.refresh_token) {
      localStorage.removeItem('playground-finder-auth');
    }
  }
} catch (error) {
  // If there's any error parsing the session, remove it
  localStorage.removeItem('playground-finder-auth');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'playground-finder-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    onAuthStateChange: (event) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        localStorage.removeItem('playground-finder-auth');
        window.location.reload();
      }
    }
  }
});

// Helper to check if session is valid
export const isSessionValid = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};