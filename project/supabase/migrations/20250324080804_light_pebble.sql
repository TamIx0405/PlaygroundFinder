/*
  # Add profiles table and fix relationships

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Create profiles for existing users
    - Update foreign key relationships for playground_ratings and playdates
    - Add RLS policies for profiles table

  3. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create temporary table to store existing relationships
CREATE TEMP TABLE temp_ratings AS
SELECT user_id FROM playground_ratings;

CREATE TEMP TABLE temp_playdates AS
SELECT organizer_id FROM playdates;

-- Backfill existing users including those referenced in ratings and playdates
INSERT INTO public.profiles (id, email)
SELECT DISTINCT u.id, u.email
FROM auth.users u
LEFT JOIN temp_ratings tr ON tr.user_id = u.id
LEFT JOIN temp_playdates tp ON tp.organizer_id = u.id
ON CONFLICT (id) DO NOTHING;

-- Drop temporary tables
DROP TABLE temp_ratings;
DROP TABLE temp_playdates;

-- Now safe to update foreign key relationships
ALTER TABLE playground_ratings
DROP CONSTRAINT IF EXISTS playground_ratings_user_id_fkey,
ADD CONSTRAINT playground_ratings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE playdates
DROP CONSTRAINT IF EXISTS playdates_organizer_id_fkey,
ADD CONSTRAINT playdates_organizer_id_fkey
  FOREIGN KEY (organizer_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;