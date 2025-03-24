import { useState, useEffect } from 'react';
import { Star, MapPin, Users, Calendar, MessageSquare } from 'lucide-react';
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
  organizer_id: string;
  organizer_email?: string;
  organizer?: { email?: string } | { email?: string }[]; // Explicitly define the type of organizer
}

interface Rating {
  rating: number;
  comment: string;
  user_email: string;
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
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    fetchRatings();
    fetchImages();
    fetchUpcomingPlaydates();
  }, [id]);

  async function fetchRatings() {
    try {
      const { data, error } = await supabase
        .from('playground_ratings')
        .select(`
          rating,
          comment,
          user_id,
          user:profiles!playground_ratings_user_id_fkey (
            email
          )
        `)
        .eq('playground_id', id);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, curr) => sum + curr.rating, 0);
        setAverageRating(total / data.length);
        setRatingCount(data.length);
        
        // Format ratings with comments
        setRatings(data.map(r => ({
          rating: r.rating,
          comment: r.comment,
          user_email: Array.isArray(r.user) 
            ? 'Anonymous' 
            : (r.user as { email?: string })?.email || 'Anonymous'
        })));
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

      const { data: playdates, error: playdatesError } = await supabase
        .from('playdates')
        .select(`
          id,
          date,
          description,
          organizer_id,
          organizer:profiles!playdates_organizer_id_fkey (
            email
          )
        `)
        .eq('playground_id', id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3);

      if (playdatesError) throw playdatesError;

      if (playdates) {
        const playdatesWithEmails = playdates.map(playdate => ({
          id: playdate.id,
          date: playdate.date,
          description: playdate.description,
          organizer_id: playdate.organizer_id,
          organizer_email: Array.isArray(playdate.organizer)
            ? playdate.organizer[0]?.email || 'Anonymous'
            : (playdate.organizer as { email?: string })?.email || 'Anonymous'
        }));

        setUpcomingPlaydates(playdatesWithEmails);
      }
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
                  {playdate.organizer_email && (
                    <p className="text-xs text-gray-500 mt-1">
                      Organized by: {playdate.organizer_email}
                    </p>
                  )}
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

        {/* Comments Section */}
        {ratings.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare size={16} />
              Comments
            </h4>
            <div className="space-y-4">
              {ratings.filter(r => r.comment).map((rating, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(rating.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className="text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      by {rating.user_email}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{rating.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
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