/*
  # Add unique constraint for playground ratings

  1. Changes
    - Add unique constraint to ensure users can only rate each playground once
    - Add index for faster rating lookups

  2. Security
    - No changes to existing policies
*/

-- Add unique constraint for user ratings
ALTER TABLE playground_ratings
ADD CONSTRAINT unique_user_playground_rating 
UNIQUE (user_id, playground_id);

-- Add index for faster rating lookups
CREATE INDEX IF NOT EXISTS idx_playground_ratings_user_playground
ON playground_ratings(user_id, playground_id);