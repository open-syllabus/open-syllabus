-- Ensure the documents bucket exists and is public
-- This is needed for files that were uploaded before we switched to reading_documents bucket

-- 1. Check if documents bucket exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets 
WHERE id = 'documents';

-- 2. If it exists but is not public, make it public
UPDATE storage.buckets 
SET public = true
WHERE id = 'documents' AND public = false;

-- 3. Create public read policy if it doesn't exist
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

CREATE POLICY "Public can view documents" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- 4. Verify the bucket is now public
SELECT 
    id,
    public,
    CASE 
        WHEN public = true THEN 'Bucket is PUBLIC - URLs will work'
        ELSE 'Bucket is PRIVATE - URLs will return 404'
    END as status
FROM storage.buckets 
WHERE id = 'documents';

-- 5. Test if we can see the specific file
SELECT 
    id,
    bucket_id,
    name,
    created_at
FROM storage.objects 
WHERE bucket_id = 'documents' 
  AND name = 'e4eeb663-529f-47e1-938c-258a03ac4f58_1750580109585_Animal_Farm_by_George_Orwell.pdf';