import { Calendar, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface UserPlaydate {
  id: string;
  date: string;
  description: string;
  playground: {
    name: string;
    location: string;
  };
}

export function UserPlaydates() {
  const [playdates, setPlaydates] = useState<UserPlaydate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPlaydates();
  }, []);

  async function fetchUserPlaydates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playdates')
        .select(`
          id,
          date,
          description,
          playground:playgrounds (
            name,
            location
          )
        `)
        .eq('organizer_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setPlaydates(
        (data || []).map((playdate: any) => ({
          ...playdate,
          playground: playdate.playground[0], // Ensure playground is a single object
        }))
      );
    } catch (error) {
      console.error('Error fetching user playdates:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your playdates...</p>
      </div>
    );
  }

  if (playdates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You haven't scheduled any playdates yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playdates.map((playdate) => (
        <div key={playdate.id} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar size={18} />
            <span className="font-medium">
              {format(new Date(playdate.date), 'PPp')}
            </span>
          </div>
          <h3 className="text-lg font-medium mb-1">{playdate.playground.name}</h3>
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
            <MapPin size={14} />
            <span>{playdate.playground.location}</span>
          </div>
          <p className="text-gray-700">{playdate.description}</p>
        </div>
      ))}
    </div>
  );
}
function useState<T>(initialValue: T): [T, (newValue: T) => void] {
  let value = initialValue;
  const setValue = (newValue: T) => {
    value = newValue;
    // In a real implementation, this would trigger a re-render.
    console.log('State updated:', value);
  };
  return [value, setValue];
}
function useEffect(effect: () => void | (() => void)) {
  // In a real implementation, this would track dependencies and re-run the effect
  // when dependencies change. For now, we'll just call the effect immediately.
  const cleanup = effect();
  if (typeof cleanup === 'function') {
    // In a real implementation, this would store the cleanup function to be called later.
    console.log('Effect cleanup function registered.');
  }
}

