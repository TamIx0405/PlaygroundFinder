import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PlaygroundCard } from './components/PlaygroundCard';
import { AddPlayground } from './components/AddPlayground';
import { PlaygroundMap } from './components/PlaygroundMap';
import { Auth } from './components/Auth';
import { Logo } from './components/Logo';
import { UserCalendar } from './components/UserCalendar';
import { supabase } from './lib/supabase';
import { PlusCircle, LogOut, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Hopspot {
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
  const [hopspots, setHopspots] = useState<Hopspot[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHopspots();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHopspots();
      } else {
        setHopspots([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchHopspots() {
    try {
      const { data, error } = await supabase
        .from('playgrounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHopspots(data || []);
    } catch (error) {
      console.error('Error fetching hopspots:', error);
      setHopspots([]);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHopspots([]);
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
      
      {/* Interactive background elements */}
      <div className="absolute -bottom-4 -right-4 opacity-30">
        <div className="animated-rabbit" />
      </div>
      
      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-playful">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Left section */}
            <div className="flex justify-start">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-4 text-sm sm:text-base"
              >
                <PlusCircle size={18} />
                <span className="hidden sm:inline">{showAddForm ? 'Close' : 'Add Hopspot'}</span>
                <span className="sm:hidden">{showAddForm ? 'Close' : 'Add'}</span>
              </button>
            </div>

            {/* Center section - Logo */}
            <div className="flex justify-center">
              <Logo size="sm" className="sm:hidden transform hover:scale-105 transition-transform cursor-pointer" />
              <Logo size="lg" className="hidden sm:flex transform hover:scale-105 transition-transform cursor-pointer" />
            </div>

            {/* Right section */}
            <div className="flex justify-end gap-1 sm:gap-2">
              <button
                onClick={() => setShowMobileCalendar(!showMobileCalendar)}
                className="lg:hidden btn-secondary flex items-center justify-center h-8 sm:h-10 w-8 sm:w-10 p-0"
              >
                <Calendar size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-4 text-sm sm:text-base"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            {showAddForm && (
              <div className="mb-8">
                <AddPlayground onSuccess={() => {
                  setShowAddForm(false);
                  fetchHopspots();
                }} />
              </div>
            )}

            <div className="mb-8">
              <PlaygroundMap />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 font-body">Loading hopspots...</p>
              </div>
            ) : hopspots.length === 0 ? (
              <div className="text-center py-12 card-playful p-8">
                <p className="text-gray-600 font-body text-lg">No hopspots found. Add one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {hopspots.map((hopspot) => (
                  <PlaygroundCard
                    key={hopspot.id}
                    id={hopspot.id}
                    name={hopspot.name}
                    description={hopspot.description}
                    location={hopspot.location}
                    minAge={hopspot.min_age}
                    maxAge={hopspot.max_age}
                    imageUrl="https://images.unsplash.com/photo-1594796582908-720e28d8d0e9?auto=format&fit=crop&q=80&w=800"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <UserCalendar />
          </div>
          
          {/* Mobile Calendar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl transform transition-transform duration-300 ease-in-out z-20"
               style={{ transform: showMobileCalendar ? 'translateY(0)' : 'translateY(calc(100% - 40px))' }}>
            <button
              onClick={() => setShowMobileCalendar(!showMobileCalendar)}
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white rounded-t-xl p-2 shadow-md flex items-center gap-2 text-gray-600"
            >
              <Calendar size={20} />
              {showMobileCalendar ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <UserCalendar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;