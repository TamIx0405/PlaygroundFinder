/*
  # Add username and playdate participants

  1. Changes
    - Add username column to profiles table
    - Create playdate_participants table
    - Add geographical coordinates to playgrounds
    - Add indexes for geographical queries

  2. Security
    - Enable RLS on new table
    - Add policies for participants
*/

-- Add username to profiles
ALTER TABLE profiles
ADD COLUMN username text UNIQUE;

-- Add coordinates to playgrounds
ALTER TABLE playgrounds
ADD COLUMN latitude numeric(10,8),
ADD COLUMN longitude numeric(11,8);

-- Create index for geographical queries
CREATE INDEX idx_playgrounds_location ON playgrounds USING gist (
  ll_to_earth(latitude, longitude)
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
CREATE INDEX idx_playdate_participants_playdate ON playdate_participants(playdate_id);
CREATE INDEX idx_playdate_participants_user ON playdate_participants(user_id);

-- Update existing profiles to have default usernames based on email
UPDATE profiles 
SET username = LOWER(
  REGEXP_REPLACE(
    SPLIT_PART(email, '@', 1),
    '[^a-zA-Z0-9]',
    ''
  )
);

-- Make username required for new profiles
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;