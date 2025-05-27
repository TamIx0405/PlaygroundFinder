-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Create or update storage bucket for avatars with increased visibility
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[],
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif']::text[],
  owner = NULL;

-- Create function to set owner on upload with improved path handling
CREATE OR REPLACE FUNCTION storage.handle_avatar_upload()
RETURNS trigger AS $$
BEGIN
  -- Set the owner to the authenticated user
  NEW.owner = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set owner
DROP TRIGGER IF EXISTS set_avatar_owner ON storage.objects;
CREATE TRIGGER set_avatar_owner
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION storage.handle_avatar_upload();

-- Drop existing policies to ensure clean recreation
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create improved storage policies with better access control
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Create utility functions
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

CREATE OR REPLACE FUNCTION auth.force_delete_auth_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, pg_temp
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Create function to handle user login
CREATE OR REPLACE FUNCTION public.handle_auth_user_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_login = now(),
    email_verified = true,
    failed_login_attempts = 0
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_auth_user_login();

-- Create function for nearby playgrounds search
CREATE OR REPLACE FUNCTION get_nearby_playgrounds(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  location text,
  latitude numeric,
  longitude numeric,
  distance_km double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.location,
    p.latitude,
    p.longitude,
    (earth_distance(
      ll_to_earth(p.latitude, p.longitude),
      ll_to_earth(user_lat, user_lng)
    ) / 1000.0) as distance_km
  FROM playgrounds p
  WHERE earth_box(
    ll_to_earth(user_lat, user_lng),
    radius_km * 1000.0
  ) @> ll_to_earth(p.latitude, p.longitude)
  AND earth_distance(
    ll_to_earth(p.latitude, p.longitude),
    ll_to_earth(user_lat, user_lng)
  ) < radius_km * 1000.0
  ORDER BY distance_km;
END;
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, email_verified)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      (new.raw_user_meta_data->>'username')::text,
      LOWER(REGEXP_REPLACE(SPLIT_PART(new.email, '@', 1), '[^a-zA-Z0-9]', ''))
    ),
    new.email_confirmed_at IS NOT NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.playdate_participants WHERE user_id = OLD.id;
  DELETE FROM public.playdates WHERE organizer_id = OLD.id;
  DELETE FROM public.playground_ratings WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  username text UNIQUE NOT NULL,
  avatar_url text,
  email_verified boolean DEFAULT false,
  last_login timestamptz,
  failed_login_attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playgrounds table
CREATE TABLE IF NOT EXISTS playgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  zip_code text CHECK (zip_code ~ '^[0-9]{5}$'),
  min_age integer NOT NULL,
  max_age integer NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create playground ratings table
CREATE TABLE IF NOT EXISTS playground_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playground_id uuid REFERENCES playgrounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, playground_id)
);

-- Create playground images table
CREATE TABLE IF NOT EXISTS playground_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playground_id uuid REFERENCES playgrounds(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create playdates table
CREATE TABLE IF NOT EXISTS playdates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playground_id uuid REFERENCES playgrounds(id) ON DELETE CASCADE,
  organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create playdate participants table
CREATE TABLE IF NOT EXISTS playdate_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playdate_id uuid REFERENCES playdates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('joined', 'maybe', 'cancelled')) NOT NULL DEFAULT 'joined',
  created_at timestamptz DEFAULT now(),
  UNIQUE(playdate_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playgrounds_location ON playgrounds USING gist (ll_to_earth(CAST(latitude AS float8), CAST(longitude AS float8)));
CREATE INDEX IF NOT EXISTS idx_playgrounds_zip_code ON playgrounds(zip_code);
CREATE INDEX IF NOT EXISTS idx_playground_ratings_user_playground ON playground_ratings(user_id, playground_id);
CREATE INDEX IF NOT EXISTS idx_playdates_date ON playdates(date);
CREATE INDEX IF NOT EXISTS idx_playdate_participants_playdate ON playdate_participants(playdate_id);
CREATE INDEX IF NOT EXISTS idx_playdate_participants_user ON playdate_participants(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE playgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE playdates ENABLE ROW LEVEL SECURITY;
ALTER TABLE playdate_participants ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Playgrounds policies
DROP POLICY IF EXISTS "Anyone can view playgrounds" ON playgrounds;
DROP POLICY IF EXISTS "Authenticated users can create playgrounds" ON playgrounds;
DROP POLICY IF EXISTS "Creators can update their playgrounds" ON playgrounds;

CREATE POLICY "Anyone can view playgrounds"
ON playgrounds FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create playgrounds"
ON playgrounds FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Creators can update their playgrounds"
ON playgrounds FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Playground ratings policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON playground_ratings;
DROP POLICY IF EXISTS "Authenticated users can rate once per playground" ON playground_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON playground_ratings;

CREATE POLICY "Anyone can view ratings"
ON playground_ratings FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can rate once per playground"
ON playground_ratings FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM playground_ratings
    WHERE user_id = auth.uid()
    AND playground_id = NEW.playground_id
  )
);

CREATE POLICY "Users can update their own ratings"
ON playground_ratings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Playground images policies
DROP POLICY IF EXISTS "Anyone can view images" ON playground_images;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON playground_images;

CREATE POLICY "Anyone can view images"
ON playground_images FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can upload images"
ON playground_images FOR INSERT
TO authenticated
WITH CHECK (true);

-- Playdates policies
DROP POLICY IF EXISTS "Anyone can view playdates" ON playdates;
DROP POLICY IF EXISTS "Authenticated users can create playdates" ON playdates;
DROP POLICY IF EXISTS "Organizers can update their playdates" ON playdates;

CREATE POLICY "Anyone can view playdates"
ON playdates FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create playdates"
ON playdates FOR INSERT
TO authenticated
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update their playdates"
ON playdates FOR UPDATE
TO authenticated
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- Playdate participants policies
DROP POLICY IF EXISTS "Anyone can view participants" ON playdate_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON playdate_participants;

CREATE POLICY "Users can view all participants"
ON playdate_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own participation"
ON playdate_participants FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "Users can update own participation"
ON playdate_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own participation"
ON playdate_participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
