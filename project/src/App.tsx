import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PlaygroundCard } from './components/PlaygroundCard';
import { AddPlayground } from './components/AddPlayground';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { PlusCircle, LogOut, MapPin, Sun, Cloud } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Playground {
  id: string;
  name: string;
  description: string;
  location: string;
  min_age: number;
  max_age: number;
  created_at: string;
}

function App() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaygrounds();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaygrounds();
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
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPlaygrounds([]);
    setShowAddForm(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-24 h-24 bg-accent-yellow rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-32 h-32 bg-accent-purple rounded-full opacity-20 animate-pulse delay-300"></div>
      <Sun className="absolute top-12 right-20 text-accent-yellow w-8 h-8 animate-bounce" />
      <Cloud className="absolute bottom-20 left-32 text-primary-light w-10 h-10 animate-pulse delay-500" />
      
      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-playful">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MapPin className="text-primary h-8 w-8" />
              <h1 className="text-3xl font-display font-bold text-gray-800">Playground Finder</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-body">{user.email}</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusCircle size={20} />
                {showAddForm ? 'Close' : 'Add Playground'}
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showAddForm && (
          <div className="mb-8">
            <AddPlayground onSuccess={() => {
              setShowAddForm(false);
              fetchPlaygrounds();
            }} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 font-body">Loading playgrounds...</p>
          </div>
        ) : playgrounds.length === 0 ? (
          <div className="text-center py-12 card-playful p-8">
            <p className="text-gray-600 font-body text-lg">No playgrounds found. Add one to get started!</p>
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
      </main>
    </div>
  );
}

export default App;