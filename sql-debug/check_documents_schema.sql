-- Check documents table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;

-- Check if processing metadata columns exist
SELECT 
    'processing_started_at' as column_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'processing_started_at'
    ) as exists;

SELECT 
    'processing_completed_at' as column_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'processing_completed_at'
    ) as exists;

SELECT 
    'retry_count' as column_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'retry_count'
    ) as exists;

SELECT 
    'processing_metadata' as column_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'processing_metadata'
    ) as exists;

-- Check recent documents
SELECT 
    document_id,
    chatbot_id,
    file_name,
    status,
    error_message,
    created_at,
    updated_at,
    processing_started_at,
    processing_completed_at,
    retry_count
FROM documents
ORDER BY created_at DESC
LIMIT 10;