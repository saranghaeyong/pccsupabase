-- ==============================================================================
-- FIX FOR: "Upload failed: new row violates row-level security policy"
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New query -> Paste & Run)
-- ==============================================================================

-- 1. Ensure the 'person-photos' storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'person-photos',
    'person-photos',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Drop any previous or conflicting policies on storage.objects
DROP POLICY IF EXISTS "Public Access to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- 3. Allow anonymous & authenticated visitors to read portrait photos
-- (CRITICAL: Required because Supabase upload executes INSERT ... RETURNING *)
CREATE POLICY "Allow public select on person-photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 4. Allow anonymous & authenticated visitors to upload portrait photos
CREATE POLICY "Allow public uploads to person-photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'person-photos');

-- 5. Allow update on person-photos
CREATE POLICY "Allow public update on person-photos"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 6. Allow delete on person-photos (removes orphaned/deleted card portraits)
DROP POLICY IF EXISTS "Allow public delete on person-photos" ON storage.objects;
CREATE POLICY "Allow public delete on person-photos"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 7. Allow delete on people table
DROP POLICY IF EXISTS "Allow public delete on people" ON public.people;
CREATE POLICY "Allow public delete on people"
ON public.people
FOR DELETE
TO anon, authenticated
USING (true);
