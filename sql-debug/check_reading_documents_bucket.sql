-- Comprehensive check of reading_documents bucket configuration
-- Run this in Supabase SQL editor to diagnose the issue

-- 1. Check if reading_documents bucket exists
SELECT 
    id as bucket_id,
    name as bucket_name,
    owner,
    created_at,
    updated_at,
    public,
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'reading_documents' OR name = 'reading_documents';

-- 2. Check ALL storage buckets to see what exists
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    created_at
FROM storage.buckets
ORDER BY created_at DESC;

-- 3. Check if there are any objects in reading_documents bucket
SELECT 
    COUNT(*) as object_count,
    bucket_id
FROM storage.objects 
WHERE bucket_id = 'reading_documents'
GROUP BY bucket_id;

-- 4. Check sample of objects in any bucket that might contain reading docs
SELECT 
    id,
    bucket_id,
    name,
    owner,
    created_at,
    metadata
FROM storage.objects 
WHERE name LIKE '%reading%' 
   OR name LIKE '%chatbot%'
   OR bucket_id LIKE '%reading%'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check storage policies for reading_documents bucket
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (qual::text LIKE '%reading_documents%' OR with_check::text LIKE '%reading_documents%');

-- 6. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 7. Check the reading_documents table to see what file paths are stored
SELECT 
    id,
    chatbot_id,
    content_type,
    file_name,
    file_path,
    file_url,
    created_at,
    updated_at
FROM reading_documents
ORDER BY created_at DESC
LIMIT 5;

-- 8. Check if the bucket name is exactly 'reading_documents' (no spaces or special chars)
SELECT 
    id,
    LENGTH(id) as id_length,
    ASCII(SUBSTRING(id, 1, 1)) as first_char_ascii,
    ASCII(SUBSTRING(id, LENGTH(id), 1)) as last_char_ascii
FROM storage.buckets 
WHERE id LIKE '%reading%';