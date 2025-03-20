import { useState, useEffect } from 'react';
import { Star, MapPin, Users, Calendar } from 'lucide-react';
import { RatingComponent } from './Rating';
import { PlaydateComponent } from './Playdate';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface PlaygroundCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  minAge: number;
  maxAge: number;
  imageUrl?: string;
}

interface Playdate {
  id: string;
  date: string;
  description: string;
  organizer: {
    email: string;
  };
}

export function PlaygroundCard({
  id,
  name,
  description,
  location,
  minAge,
  maxAge,
  imageUrl,
}: PlaygroundCardProps) {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [showPlaydateModal, setShowPlaydateModal] = useState(false);
  const [upcomingPlaydates, setUpcomingPlaydates] = useState<Playdate[]>([]);

  useEffect(() => {
    fetchRatings();
    fetchImages();
    fetchUpcomingPlaydates();
  }, [id]);

  async function fetchRatings() {
    try {
      const { data, error } = await supabase
        .from('playground_ratings')
        .select('rating')
        .eq('playground_id', id);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, curr) => sum + curr.rating, 0);
        setAverageRating(total / data.length);
        setRatingCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }

  async function fetchImages() {
    try {
      const { data, error } = await supabase
        .from('playground_images')
        .select('image_url')
        .eq('playground_id', id);

      if (error) throw error;

      if (data) {
        setImages(data.map(img => img.image_url));
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }

  async function fetchUpcomingPlaydates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playdates')
        .select(`
          id,
          date,
          description,
          organizer:organizer_id(email)
        `)
        .eq('playground_id', id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingPlaydates(
        (data || []).map((playdate) => ({
          ...playdate,
          organizer: playdate.organizer[0], // Extract the first organizer
        }))
      );
    } catch (error) {
      console.error('Error fetching playdates:', error);
    }
  }

  const handleRatingUpdate = () => {
    fetchRatings();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {(images.length > 0 || imageUrl) && (
        <img
          src={images[0] || imageUrl}
          alt={name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin size={16} />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <Users size={16} />
          <span>Ages {minAge}-{maxAge}</span>
          {averageRating !== null && (
            <div className="flex items-center ml-auto">
              <Star className="text-yellow-400 fill-yellow-400" size={16} />
              <span className="ml-1">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500 ml-1">({ratingCount})</span>
            </div>
          )}
        </div>
        <p className="text-gray-700 text-sm mb-4">{description}</p>

        {upcomingPlaydates.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Playdates:</h4>
            <div className="space-y-2">
              {upcomingPlaydates.map((playdate) => (
                <div key={playdate.id} className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">
                      {format(new Date(playdate.date), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{playdate.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Organized by: {playdate.organizer.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowPlaydateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Calendar size={16} />
            Schedule Playdate
          </button>
        </div>

        <RatingComponent playgroundId={id} onRatingUpdate={handleRatingUpdate} />
      </div>

      {showPlaydateModal && (
        <PlaydateComponent
          playgroundId={id}
          playgroundName={name}
          onClose={() => setShowPlaydateModal(false)}
        />
      )}
    </div>
  );
}