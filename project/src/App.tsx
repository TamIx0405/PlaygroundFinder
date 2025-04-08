import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PlaygroundCard } from './components/PlaygroundCard';
import { AddPlayground } from './components/AddPlayground';
import { PlaygroundMap } from './components/PlaygroundMap';
import { Auth } from './components/Auth';
import { Logo } from './components/Logo';
import { UserProfile } from './components/UserProfile';
import { UserAvatar } from './components/UserAvatar';
import { supabase } from './lib/supabase';
import { LogOut, Rabbit } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Playground {
  id: string;
  name: string;
  description: string;
  location: string;
  min_age: number;
  max_age: number;
  created_at: string;
  latitude: number;
  longitude: number;
}

function App() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaygrounds();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaygrounds();
      } else {
        setPlaygrounds([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchPlaygrounds() {
    try {
      const { data, error } = await supabase
        .from('playgrounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaygrounds(data || []);
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
      setPlaygrounds([]);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPlaygrounds([]);
    setShowAddForm(false);
    setShowProfile(false);
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <Auth />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-sky-50 relative overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* Interactive background elements */}
      <Rabbit className="animated-rabbit absolute -bottom-4 -right-4 opacity-30" size={20} />
      
      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-playful">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo size="md" />
            </div>
            <nav className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowProfile(false);
                }}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4"
              >
               
                <span>{showAddForm ? 'Close' : 'Add Playground'}</span>
              </button>
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowAddForm(false);
                }}
                className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4"
              >
                <UserAvatar size="sm" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        {showProfile ? (
          <UserProfile />
        ) : (
          <>
            {showAddForm && (
              <div className="mb-8">
                <AddPlayground onSuccess={() => {
                  setShowAddForm(false);
                  fetchPlaygrounds();
                }} />
              </div>
            )}

            <div className="mb-8">
              <PlaygroundMap />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 font-body">Loading playgrounds...</p>
              </div>
            ) : playgrounds.length === 0 ? (
              <div className="text-center py-12 card-playful p-8">
                <p className="text-gray-600 font-body text-lg">No playgrounds found. Add one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playgrounds.map((playground) => (
                  <PlaygroundCard
                    key={playground.id}
                    id={playground.id}
                    name={playground.name}
                    description={playground.description}
                    location={playground.location}
                    minAge={playground.min_age}
                    maxAge={playground.max_age}
                    imageUrl="https://images.unsplash.com/photo-1594796582908-720e28d8d0e9?auto=format&fit=crop&q=80&w=800"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;