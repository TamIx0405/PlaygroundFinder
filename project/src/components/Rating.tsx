import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface RatingProps {
  playgroundId: string;
  onRatingUpdate: (newRating: number) => void;
}

interface Rating {
  rating: number;
  comment: string;
}

export function RatingComponent({ playgroundId, onRatingUpdate }: RatingProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUserRating();
  }, [playgroundId]);

  async function fetchUserRating() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

   
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('error loading profile');
        return;
      }

   
      if (!profile) {
        console.warn('No profile found for user');
        return;
      }

      const { data, error } = await supabase
        .from('playground_ratings')
        .select('rating, comment')
        .eq('playground_id', playgroundId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserRating(data);
        setRating(data.rating);
        setComment(data.comment || '');
      } else {
        setUserRating(null);
        setRating(0);
        setComment('');
      }
    } catch (error) {
      console.error('Error fetching user rating', error);
      toast.error('Error loading user rating');
    }
  }

  const handleRatingClick = async (selectedRating: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please log in to rate');
      return;
    }

    setRating(selectedRating);
    setShowCommentForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to rate');
      }

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Error loading profile');
      }

      if (!profile) {
        throw new Error('No profile found. Load page again.');
      }

      
      const { error: ratingError } = await supabase
        .from('playground_ratings')
        .upsert({
          playground_id: playgroundId,
          user_id: profile.id,
          rating,
          comment
        });

      if (ratingError) throw ratingError;

      toast.success('Rating successfully updated');
      setUserRating({ rating, comment });
      setShowCommentForm(false);
      onRatingUpdate(rating);
    } catch (error: any) {
      toast.error(error.message || 'Error setting rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRatingClick(star)}
            className="focus:outline-none"
          >
            <Star
              size={20}
              className={`${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
        {userRating && (
          <span className="ml-2 text-sm text-gray-600">
            rating: {userRating.rating}/5
          </span>
        )}
      </div>

      {showCommentForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Comment (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Leave rating!'}
            </button>
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}