-- Create and configure the reading_documents storage bucket
-- Run this in Supabase SQL editor as administrator

-- 1. First check if the bucket exists
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'reading_documents';

-- 2. Create the bucket if it doesn't exist
-- Note: If you get an error that the bucket already exists, skip this step
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reading_documents',
    'reading_documents', 
    true, -- Make it public so getPublicUrl works
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'video/mp4', 'video/webm', 'text/plain']::text[]
);

-- 3. If bucket exists but is not public, update it
UPDATE storage.buckets 
SET public = true
WHERE id = 'reading_documents';

-- 4. Create storage policies for the bucket
-- Drop any existing policies first
DROP POLICY IF EXISTS "Public users can view reading documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload reading documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update reading documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete reading documents" ON storage.objects;

-- Allow public read access (required for getPublicUrl to work)
CREATE POLICY "Public users can view reading documents" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reading_documents');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload reading documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'reading_documents');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update reading documents" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'reading_documents')
WITH CHECK (bucket_id = 'reading_documents');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete reading documents" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'reading_documents');

-- 5. Verify the bucket configuration
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'reading_documents';

-- 6. Verify the policies were created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (qual::text LIKE '%reading_documents%' OR with_check::text LIKE '%reading_documents%')
ORDER BY policyname;

-- 7. Check if RLS is enabled (it should be)
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';