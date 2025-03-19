import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react'; // Ensure this is the correct import

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
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return;
      const user = data.user;

      const { data: ratingData, error: ratingError } = await supabase
        .from('playground_ratings')
        .select('rating, comment')
        .eq('playground_id', playgroundId)
        .eq('user_id', user.id)
        .single();

      if (ratingError) throw ratingError;
      if (ratingData) {
        setUserRating(ratingData);
        setRating(ratingData.rating);
        setComment(ratingData.comment || '');
      }
    } catch (err) {
      console.error('Error fetching user rating:', err);
    }
  }

  const handleRatingClick = async (selectedRating: number) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      toast.error('Please log in to rate playgrounds');
      return;
    }
    setRating(selectedRating);
    setShowCommentForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) throw new Error('You must be logged in to rate playgrounds');
      const user = data.user;

      const { error: ratingError } = await supabase.from('playground_ratings').upsert({
        playground_id: playgroundId,
        user_id: user.id,
        rating,
        comment
      });
      if (ratingError) throw ratingError;

      toast.success('Rating updated successfully!');
      setUserRating({ rating, comment });
      setShowCommentForm(false);
      onRatingUpdate(rating);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
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
                star <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
        {userRating && (
          <span className="ml-2 text-sm text-gray-600">
            Your rating: {userRating.rating}/5
          </span>
        )}
      </div>

      {showCommentForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button type="button" onClick={() => setShowCommentForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
