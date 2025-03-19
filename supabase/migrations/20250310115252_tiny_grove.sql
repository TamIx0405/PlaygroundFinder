/*
  # Playground App Schema

  1. New Tables
    - `playgrounds`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `location` (text)
      - `min_age` (integer)
      - `max_age` (integer)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

    - `playground_images`
      - `id` (uuid, primary key)
      - `playground_id` (uuid, references playgrounds)
      - `image_url` (text)
      - `uploaded_by` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `playground_ratings`
      - `id` (uuid, primary key)
      - `playground_id` (uuid, references playgrounds)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create playgrounds table
CREATE TABLE IF NOT EXISTS playgrounds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    location text NOT NULL,
    min_age integer NOT NULL,
    max_age integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users NOT NULL
);

-- Create playground images table
CREATE TABLE IF NOT EXISTS playground_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playground_id uuid REFERENCES playgrounds ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    uploaded_by uuid REFERENCES auth.users NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create playground ratings table
CREATE TABLE IF NOT EXISTS playground_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playground_id uuid REFERENCES playgrounds ON DELETE CASCADE NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment text,
    user_id uuid REFERENCES auth.users NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE playgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for playgrounds
CREATE POLICY "Anyone can view playgrounds"
    ON playgrounds
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create playgrounds"
    ON playgrounds
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Policies for playground images
CREATE POLICY "Anyone can view playground images"
    ON playground_images
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can upload images"
    ON playground_images
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

-- Policies for playground ratings
CREATE POLICY "Anyone can view ratings"
    ON playground_ratings
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create ratings"
    ON playground_ratings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);