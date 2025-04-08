import React, { useState, useEffect } from 'react';
import { Star, MapPin, Users, Calendar, MessageSquare, Rabbit } from 'lucide-react';
import { RatingComponent } from './Rating';
import { PlaydateComponent } from './PlaydateComponent';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PlaygroundCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  minAge: number;
  maxAge: number;
  imageUrl?: string;
}

interface Rating {
  rating: number;
  comment: string;
  user: {
    username: string;
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
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showAllDescription, setShowAllDescription] = useState(false);

  useEffect(() => {
    fetchRatings();
    fetchImages();
  }, [id]);

  async function fetchRatings() {
    try {
      const { data, error } = await supabase
        .from('playground_ratings')
        .select(`
          rating,
          comment,
          profiles (
            username
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
          user: {
            username: r.profiles.username
          }
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

  return (
    <div className="card-playful overflow-hidden relative">
      <Rabbit className="animated-rabbit absolute -bottom-4 right-10 opacity-30" size={20} />

      {(images.length > 0 || imageUrl) && (
        <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-3xl">
          <img
            src={images[0] || imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-gray-800 line-clamp-2">{name}</h3>
          
          <div className="flex flex-wrap items-center gap-2 text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin size={16} className="text-primary" />
              <span className="font-body text-sm">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} className="text-secondary" />
              <span className="font-body text-sm">Ages {minAge}-{maxAge}</span>
            </div>
            {averageRating !== null && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="text-accent-yellow fill-accent-yellow" size={16} />
                <span className="font-semibold text-sm">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({ratingCount})</span>
              </div>
            )}
          </div>

          <div className="relative">
            <p className={`text-gray-700 font-body text-sm sm:text-base ${!showAllDescription && 'line-clamp-3'}`}>
              {description}
            </p>
            {description.length > 150 && (
              <button
                onClick={() => setShowAllDescription(!showAllDescription)}
                className="text-primary text-sm font-medium hover:underline mt-1"
              >
                {showAllDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowPlaydateModal(true)}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm w-full"
          >
            <Calendar size={18} />
            <span className="hidden sm:inline">Schedule Playdate</span>
            <span className="sm:hidden">Schedule</span>
          </button>
        </div>

        <div className="mt-6">
          <RatingComponent playgroundId={id} onRatingUpdate={fetchRatings} />
        </div>

        {ratings.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-lg font-display font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Reviews
            </h4>
            <div className="space-y-4">
              {ratings.filter(r => r.comment).map((rating, index) => (
                <div key={index} className="bg-background-light/30 p-3 sm:p-4 rounded-2xl">
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
                      by {rating.user.username}
                    </span>
                  </div>
                  <p className="text-gray-700 font-body text-sm">{rating.comment}</p>
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