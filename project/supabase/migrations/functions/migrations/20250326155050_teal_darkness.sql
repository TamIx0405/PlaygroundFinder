/*
  # Add username and location features

  1. Changes
    - Add username to profiles
    - Add coordinates to playgrounds
    - Create playdate participants table
    - Add required extensions for geolocation
    - Add indexes for performance

  2. Security
    - Enable RLS on new table
    - Add policies for participants
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Add username to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Add coordinates to playgrounds
ALTER TABLE playgrounds
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8);

-- Create index for geographical queries
CREATE INDEX IF NOT EXISTS idx_playgrounds_location ON playgrounds USING gist (
  ll_to_earth(CAST(latitude AS float8), CAST(longitude AS float8))
);

-- Create playdate participants table
CREATE TABLE IF NOT EXISTS playdate_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playdate_id uuid REFERENCES playdates ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
    status text CHECK (status IN ('joined', 'maybe', 'cancelled')) NOT NULL DEFAULT 'joined',
    created_at timestamptz DEFAULT now(),
    UNIQUE(playdate_id, user_id)
);

-- Enable RLS
ALTER TABLE playdate_participants ENABLE ROW LEVEL SECURITY;

-- Policies for playdate participants
CREATE POLICY "Anyone can view participants"
    ON playdate_participants
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Users can join playdates"
    ON playdate_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
    ON playdate_participants
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playdate_participants_playdate ON playdate_participants(playdate_id);
CREATE INDEX IF NOT EXISTS idx_playdate_participants_user ON playdate_participants(user_id);

-- Update existing profiles to have default usernames based on email
DO $$ 
BEGIN
  UPDATE profiles 
  SET username = LOWER(
    REGEXP_REPLACE(
      SPLIT_PART(email, '@', 1),
      '[^a-zA-Z0-9]',
      ''
    )
  )
  WHERE username IS NULL AND email IS NOT NULL;
END $$;

-- Make username required for new profiles
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;