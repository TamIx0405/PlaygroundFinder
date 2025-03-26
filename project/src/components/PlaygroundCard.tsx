import React, { useState, useEffect } from 'react';
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
          profiles!playground_ratings_user_id_fkey (
            email
          )
        `)
        .eq('playground_id', id);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, curr) => sum + curr.rating, 0);
        setAverageRating(total / data.length);
        setRatingCount(data.length);
        
        setRatings(data.map(r => ({
          rating: r.rating,
          comment: r.comment,
          user_email: r.profiles?.email || 'Anonymous'
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
          profiles!playdates_organizer_id_fkey (
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
          ...playdate,
          organizer_email: playdate.profiles?.email
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
    <div className="card-playful overflow-hidden transform hover:scale-102 transition-all duration-300">
      {(images.length > 0 || imageUrl) && (
        <div className="relative h-48 overflow-hidden rounded-t-3xl">
          <img
            src={images[0] || imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">{name}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin size={16} className="text-primary" />
          <span className="font-body">{location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Users size={16} className="text-secondary" />
          <span className="font-body">Ages {minAge}-{maxAge}</span>
          {averageRating !== null && (
            <div className="flex items-center ml-auto">
              <Star className="text-accent-yellow fill-accent-yellow" size={16} />
              <span className="ml-1 font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500 ml-1">({ratingCount})</span>
            </div>
          )}
        </div>
        <p className="text-gray-700 font-body mb-6">{description}</p>

        {upcomingPlaydates.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-display font-semibold text-gray-800 mb-3">Upcoming Playdates</h4>
            <div className="space-y-3">
              {upcomingPlaydates.map((playdate) => (
                <div key={playdate.id} className="bg-background-light/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-primary-dark">
                    <Calendar size={16} />
                    <span className="font-body font-medium">
                      {format(new Date(playdate.date), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-gray-700 font-body mt-2">{playdate.description}</p>
                  {playdate.organizer_email && (
                    <p className="text-sm text-gray-500 font-body mt-1">
                      Organized by: {playdate.organizer_email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowPlaydateModal(true)}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Calendar size={18} />
            Schedule Playdate
          </button>
        </div>

        <RatingComponent playgroundId={id} onRatingUpdate={handleRatingUpdate} />

        {ratings.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-lg font-display font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Comments
            </h4>
            <div className="space-y-4">
              {ratings.filter(r => r.comment).map((rating, index) => (
                <div key={index} className="bg-background-light/30 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(rating.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className="text-accent-yellow fill-accent-yellow"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-body">
                      by {rating.user_email}
                    </span>
                  </div>
                  <p className="text-gray-700 font-body">{rating.comment}</p>
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