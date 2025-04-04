import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PlaygroundCard } from './components/PlaygroundCard';
import { AddPlayground } from './components/AddPlayground';
import { PlaygroundMap } from './components/PlaygroundMap';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { PlusCircle, LogOut, MapPin, Sun, Cloud, Bird, Fish, Rabbit } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

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
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-sky-50 relative overflow-x-hidden">
      <Toaster position="top-right" />
      
      <Fish className="absolute bottom-10 left-30 animated-duck" size={60} />
      <Fish className="absolute bottom-20 right-40 animated-duck" size={75} />
      
      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-playful">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-primary h-8 w-8" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-800">HopSpot</h1>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4"
              >
                <PlusCircle size={20} />
                <span className="sm:inline">{showAddForm ? 'Close' : 'Add HopSpot'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center justify-center gap-2 py-2 px-4"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
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
            <p className="mt-4 text-gray-600 font-body">Loading HopSpots...</p>
          </div>
        ) : playgrounds.length === 0 ? (
          <div className="text-center py-12 card-playful p-8">
            <p className="text-gray-600 font-body text-lg">No playgrounds found! Please add one!</p>
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