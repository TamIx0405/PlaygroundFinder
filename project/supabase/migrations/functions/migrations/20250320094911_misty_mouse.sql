/*
  # Add Playdate Features

  1. New Tables
    - `playdates`
      - `id` (uuid, primary key)
      - `playground_id` (uuid, references playgrounds)
      - `organizer_id` (uuid, references auth.users)
      - `date` (timestamptz)
      - `description` (text)
      - `created_at` (timestamptz)

    - `playdate_invitations`
      - `id` (uuid, primary key)
      - `playdate_id` (uuid, references playdates)
      - `user_id` (uuid, references auth.users)
      - `status` (text: pending, accepted, declined)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create playdates table
CREATE TABLE IF NOT EXISTS playdates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playground_id uuid REFERENCES playgrounds ON DELETE CASCADE NOT NULL,
    organizer_id uuid REFERENCES auth.users NOT NULL,
    date timestamptz NOT NULL,
    description text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create playdate invitations table
CREATE TABLE IF NOT EXISTS playdate_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playdate_id uuid REFERENCES playdates ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users NOT NULL,
    status text CHECK (status IN ('pending', 'accepted', 'declined')) NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE playdates ENABLE ROW LEVEL SECURITY;
ALTER TABLE playdate_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for playdates
CREATE POLICY "Anyone can view playdates"
    ON playdates
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create playdates"
    ON playdates
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their playdates"
    ON playdates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their playdates"
    ON playdates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = organizer_id);

-- Policies for playdate invitations
CREATE POLICY "Users can view invitations they're involved with"
    ON playdate_invitations
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT organizer_id FROM playdates WHERE id = playdate_id
        )
    );

CREATE POLICY "Organizers can create invitations"
    ON playdate_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT organizer_id FROM playdates WHERE id = playdate_id
        )
    );

CREATE POLICY "Invited users can update their invitation status"
    ON playdate_invitations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_playdates_date ON playdates (date);
CREATE INDEX IF NOT EXISTS idx_playdate_invitations_status ON playdate_invitations (status);