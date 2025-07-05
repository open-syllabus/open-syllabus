-- Remove documents table from realtime publication if it was added
-- This might be causing issues with document processing

-- First check what tables are in the realtime publication
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    schemaname, tablename;

-- If documents is in the list, remove it:
-- ALTER PUBLICATION supabase_realtime DROP TABLE documents;

-- Note: Only run the ALTER command if documents appears in the list above