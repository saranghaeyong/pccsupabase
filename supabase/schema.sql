-- ==============================================================================
-- PERSON CARD COLLECTION - SUPABASE DATABASE & STORAGE SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- to provision the database table, indexes, Row-Level Security, and Storage bucket.

-- 1. Enable pgcrypto for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the `people` table
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    date_of_birth DATE NOT NULL,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create helpful indexes for fast sorting and searching
CREATE INDEX IF NOT EXISTS idx_people_created_at ON public.people (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_people_name ON public.people (name);
CREATE INDEX IF NOT EXISTS idx_people_age ON public.people (age);
CREATE INDEX IF NOT EXISTS idx_people_date_of_birth ON public.people (date_of_birth);

-- 4. Enable Row Level Security (RLS) on `people` table
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- 5. Define Public RLS Policies
-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read access to people" ON public.people;
DROP POLICY IF EXISTS "Allow public insert to people" ON public.people;
DROP POLICY IF EXISTS "Deny public update to people" ON public.people;
DROP POLICY IF EXISTS "Deny public delete to people" ON public.people;

-- Policy: Anyone (anon or authenticated) can view person cards
CREATE POLICY "Allow public read access to people" 
ON public.people 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Policy: Anyone (anon or authenticated) can create new person cards
CREATE POLICY "Allow public insert to people" 
ON public.people 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Policy: Anyone (anon or authenticated) can delete person cards
DROP POLICY IF EXISTS "Allow public delete on people" ON public.people;
CREATE POLICY "Allow public delete on people" 
ON public.people 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- 6. Storage Bucket Provisioning: `person-photos`
-- Creates a public bucket for card portrait photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'person-photos',
    'person-photos',
    true,
    10485760, -- 10 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 7. Storage Bucket Security Policies on `storage.objects`
-- Fixes: "Upload failed: new row violates row-level security policy"
-- Drop existing storage policies if re-running
DROP POLICY IF EXISTS "Public Access to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- Policy: Anyone can view and read uploaded portrait photos (needed for upload RETURNING clause & display)
CREATE POLICY "Allow public select on person-photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'person-photos');

-- Policy: Anyone can upload portrait photos to person-photos bucket
CREATE POLICY "Allow public uploads to person-photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'person-photos');

-- Policy: Anyone can update portrait photos if needed
CREATE POLICY "Allow public update on person-photos"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'person-photos');

-- Policy: Anyone can delete portrait photos from person-photos bucket
DROP POLICY IF EXISTS "Allow public delete on person-photos" ON storage.objects;
CREATE POLICY "Allow public delete on person-photos"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 8. Enable Realtime for the `people` table
-- (Allows live updates across all connected visitor browsers)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'people'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.people;
    END IF;
END $$;
