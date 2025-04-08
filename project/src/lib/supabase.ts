import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Verify localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

if (!isLocalStorageAvailable()) {
  throw new Error('Local storage is not available. Please enable it in your browser settings.');
}

// Clear any potentially corrupted tokens
try {
  const currentSession = localStorage.getItem('playground-finder-auth');
  if (currentSession) {
    const session = JSON.parse(currentSession);
    // Check for both refresh_token and access_token
    if (!session.refresh_token || !session.access_token) {
      // Remove all auth-related items if session is invalid
      localStorage.removeItem('playground-finder-auth');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.expires_in');
    }
  }
} catch (error) {
  // If there's any error parsing the session, remove all auth-related items
  localStorage.removeItem('playground-finder-auth');
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('supabase.auth.refreshToken');
  localStorage.removeItem('supabase.auth.expires_at');
  localStorage.removeItem('supabase.auth.expires_in');
}

// Helper to clear all auth-related storage
const clearAuthStorage = () => {
  localStorage.removeItem('playground-finder-auth');
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('supabase.auth.refreshToken');
  localStorage.removeItem('supabase.auth.expires_at');
  localStorage.removeItem('supabase.auth.expires_in');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'playground-finder-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    onAuthStateChange: async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        clearAuthStorage();
        
        // Force a clean reload of the application
        window.location.href = '/';
      } else if (event === 'SIGNED_IN' && session) {
        // Clear any existing auth data before storing new session
        clearAuthStorage();
        // Ensure the new session is properly stored
        localStorage.setItem('playground-finder-auth', JSON.stringify(session));
      }
    }
  }
});

// Helper to check if session is valid
export const isSessionValid = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session validation error:', error);
      clearAuthStorage();
      return false;
    }
    return session !== null && session.refresh_token !== null;
  } catch (error) {
    console.error('Session check failed:', error);
    clearAuthStorage();
    return false;
  }
};

// Helper to handle sign out
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    clearAuthStorage();
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    // Force clear storage and reload even if sign out fails
    clearAuthStorage();
    window.location.href = '/';
  }
};