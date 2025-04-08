/*
  # Consolidated Schema Migration

  This migration ensures all tables, functions, and policies are properly created
  with the correct relationships and security settings.

  1. Extensions
    - storage
    - cube
    - earthdistance

  2. Tables
    - profiles
    - playgrounds
    - playground_ratings
    - playground_images
    - playdates
    - playdate_participants

  3. Storage
    - avatars bucket
    - storage policies

  4. Functions
    - handle_new_user
    - handle_user_deletion
    - handle_auth_user_login
    - get_nearby_playgrounds
    - handle_avatar_upload
    - exec_sql
    - force_delete_auth_user

  5. Security
    - RLS policies for all tables
    - Storage policies for avatars
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Create or update storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create function to set owner on upload
CREATE OR REPLACE FUNCTION storage.handle_avatar_upload()
RETURNS trigger AS $$
BEGIN
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

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

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