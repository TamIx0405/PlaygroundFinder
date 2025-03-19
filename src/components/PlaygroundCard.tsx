import { useState, useEffect } from 'react';
import { Star, MapPin, Users } from 'lucide-react';
import { RatingComponent } from './Rating';
import { supabase } from '../lib/supabase';

interface PlaygroundCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  minAge: number;
  maxAge: number;
  imageUrl?: string;
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

  useEffect(() => {
    fetchRatings();
    fetchImages();
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
        <RatingComponent playgroundId={id} onRatingUpdate={handleRatingUpdate} />
      </div>
    </div>
  );
}