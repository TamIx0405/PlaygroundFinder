import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PlaygroundCard } from './components/PlaygroundCard';
import { AddPlayground } from './components/AddPlayground';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { PlusCircle, LogOut } from 'lucide-react';
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
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPlaygrounds();
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
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Playground Finder</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.email}</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <PlusCircle size={20} />
                {showAddForm ? 'Close' : 'Add Playground'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showAddForm && (
          <div className="mb-8">
            <AddPlayground />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading playgrounds...</p>
          </div>
        ) : playgrounds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No playgrounds found. Add one to get started!</p>
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