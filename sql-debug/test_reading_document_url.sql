-- Test query to check the actual reading document URLs
-- Run this after uploading a reading document

-- 1. Get the most recent reading document and its details
SELECT 
    rd.id,
    rd.chatbot_id,
    rd.content_type,
    rd.file_name,
    rd.file_path,
    rd.file_url,
    rd.created_at,
    c.name as chatbot_name,
    c.bot_type
FROM reading_documents rd
JOIN chatbots c ON c.chatbot_id = rd.chatbot_id
ORDER BY rd.created_at DESC
LIMIT 1;

-- 2. Check if the file exists in storage
-- Replace 'YOUR_FILE_PATH' with the actual file_path from the query above
-- Example: SELECT * FROM storage.objects WHERE bucket_id = 'reading_documents' AND name = 'e7c2bd9e-8b9e-4c7f-8b1a-5f5e5e5e5e5e_1234567890_document.pdf';

-- 3. Get all files in the reading_documents bucket
SELECT 
    id,
    bucket_id,
    name,
    owner,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'reading_documents'
ORDER BY created_at DESC
LIMIT 10;

-- 4. If you're getting 404 errors, check if the URL structure is correct
-- The URL should be: https://YOUR_PROJECT.supabase.co/storage/v1/object/public/reading_documents/FILE_PATH