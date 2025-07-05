-- Check recent documents and their status
SELECT 
    document_id,
    chatbot_id,
    file_name,
    file_type,
    status,
    error_message,
    created_at,
    updated_at,
    (EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60)::int AS minutes_since_update
FROM 
    documents
WHERE 
    created_at > NOW() - INTERVAL '1 day'
ORDER BY 
    created_at DESC
LIMIT 10;

-- Check if there are any stuck processing documents
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_created,
    MAX(created_at) as newest_created
FROM 
    documents
WHERE 
    created_at > NOW() - INTERVAL '7 days'
GROUP BY 
    status
ORDER BY 
    status;

-- Check storage bucket permissions
SELECT 
    bucket_id,
    name,
    public,
    allowed_mime_types,
    avif_autodetection,
    created_at,
    updated_at
FROM 
    storage.buckets
WHERE 
    name = 'documents';

-- Check if there are any storage policies
SELECT 
    bucket_id,
    name,
    definition,
    created_at
FROM 
    storage.policies
WHERE 
    bucket_id = (SELECT id FROM storage.buckets WHERE name = 'documents');