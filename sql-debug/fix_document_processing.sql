-- Revert the realtime publication change that might be blocking document processing
-- This was added after 22/06/2025, 10:01:06 and might be causing the issue

-- Remove documents table from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE documents;

-- Verify the change
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    schemaname, tablename;