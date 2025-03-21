import { useState, useEffect } from 'react';
import { Calendar, MapPin, PlusCircle, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { AddPlayground } from './components/AddPlayground';
import { Auth } from './components/Auth';
import { PlaygroundCard } from './components/PlaygroundCard';


interface Playdate {
  id: string;
  date: string;
  description: string;
  organizer: {
    name: string;
  };
  playground: {
    name: string;
    location: string;
  };
}


interface UserPlaydatesProps {
  user: User;
}


export function UserPlaydates({ user }: UserPlaydatesProps) {
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchPlaydates();
  }, []);


  async function fetchPlaydates() {
    try {
      const { data, error } = await supabase
        .from('playdates')
        .select(`
          id,
          date,
          description,
          organizer:users!inner (name),
          playground:playgrounds!inner (
            name,
            location
          )
        `)
        .order('date', { ascending: true });


      if (error) throw error;
      setPlaydates(
        (data || []).map((playdate: any) => ({
          ...playdate,
          organizer: playdate.organizer[0],
          playground: playdate.playground[0],
        }))
      );
    } catch (error) {
      console.error('Error fetching playdates:', error);
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return <p>Loading playdates...</p>;
  }


  return (
    <div>
      <p>Welcome, {user.email}</p>
      <h2 className="text-xl font-bold mt-4">Scheduled Playdates</h2>
      {playdates.length === 0 ? (
        <p>No playdates scheduled yet.</p>
      ) : (
        <ul>
          {playdates.map((playdate) => (
            <li key={playdate.id} className="p-4 border rounded-lg mb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Calendar size={18} />
                <span className="font-medium">{format(new Date(playdate.date), 'PPp')}</span>
              </div>
              <h3 className="text-lg font-medium">{playdate.playground.name}</h3>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <MapPin size={14} />
                <span>{playdate.playground.location}</span>
              </div>
              <p className="text-gray-700">{playdate.description}</p>
              <p className="text-sm text-gray-500">Organized by: {playdate.organizer.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


interface Playground {
  id: string;
  name: string;
  description: string;
  location: string;
  min_age: number;
  max_age: number;
  created_at: string;
}


export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });


    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });


    return () => subscription.subscription.unsubscribe();
  }, []);


  useEffect(() => {
    fetchPlaygrounds();
  }, []);


  // Removed unused fetchPlaydates function


  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  async function fetchPlaygrounds() {
    try {
      const { data, error } = await supabase
        .from('playgrounds')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPlaygrounds(data || []);
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
    } finally {
      setLoading(false);
    }
  }


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
              <span className="text-gray-600">{user?.email}</span>
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
       
        <UserPlaydates user={user} />


        {loading ? (
          <p>Loading playgrounds...</p>
        ) : playgrounds.length === 0 ? (
          <p>No playgrounds found. Add one to get started!</p>
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


export default App;



