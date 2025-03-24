/*
  # Fix Foreign Key Relationships

  1. Changes
    - Drop and recreate foreign key constraint for playdates.organizer_id to reference auth.users
    - Add proper index for the foreign key

  2. Security
    - No changes to existing policies
*/

DO $$ BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'playdates_organizer_id_fkey'
  ) THEN
    ALTER TABLE playdates DROP CONSTRAINT playdates_organizer_id_fkey;
  END IF;
END $$;

-- Add proper foreign key constraint to auth.users
ALTER TABLE playdates
ADD CONSTRAINT playdates_organizer_id_fkey 
FOREIGN KEY (organizer_id) 
REFERENCES auth.users(id);

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_playdates_organizer_id 
ON playdates(organizer_id);