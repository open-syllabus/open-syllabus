-- Fix reading document URLs to point to the correct bucket
-- The issue: URLs are pointing to 'documents' bucket instead of 'reading_documents'

-- 1. First, let's see all reading documents and their current URLs
SELECT 
    id,
    chatbot_id,
    file_path,
    file_url,
    CASE 
        WHEN file_url LIKE '%/documents/%' THEN 'Wrong bucket (documents)'
        WHEN file_url LIKE '%/reading_documents/%' THEN 'Correct bucket (reading_documents)'
        ELSE 'Unknown'
    END as bucket_status
FROM reading_documents
ORDER BY created_at DESC;

-- 2. Update the URLs to point to the correct bucket
-- This replaces '/storage/v1/object/public/documents/' with '/storage/v1/object/public/reading_documents/'
UPDATE reading_documents
SET file_url = REPLACE(file_url, '/storage/v1/object/public/documents/', '/storage/v1/object/public/reading_documents/')
WHERE file_url LIKE '%/storage/v1/object/public/documents/%';

-- 3. Verify the fix
SELECT 
    id,
    file_path,
    file_url,
    CASE 
        WHEN file_url LIKE '%/documents/%' THEN 'STILL WRONG'
        WHEN file_url LIKE '%/reading_documents/%' THEN 'FIXED'
        ELSE 'Unknown'
    END as status
FROM reading_documents
ORDER BY created_at DESC;

-- 4. Check if the files actually exist in the reading_documents bucket
-- If they don't, we'll need to move them from documents to reading_documents bucket
SELECT 
    'documents' as bucket,
    COUNT(*) as file_count
FROM storage.objects 
WHERE bucket_id = 'documents' 
  AND name LIKE '%e4eeb663-529f-47e1-938c-258a03ac4f58%'
UNION ALL
SELECT 
    'reading_documents' as bucket,
    COUNT(*) as file_count
FROM storage.objects 
WHERE bucket_id = 'reading_documents'
  AND name LIKE '%e4eeb663-529f-47e1-938c-258a03ac4f58%';