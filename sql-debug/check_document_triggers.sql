-- Check for any triggers on the documents table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'documents'
    AND event_object_schema = 'public';

-- Check for any functions that might process documents
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND (
        p.proname LIKE '%document%' 
        OR p.proname LIKE '%process%'
        OR pg_get_functiondef(p.oid) LIKE '%documents%processing%'
    );

-- Check if there's a background job or cron job
SELECT * FROM cron.job WHERE jobname LIKE '%document%' OR command LIKE '%document%';

-- Check pg_notify usage for document processing
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    pg_get_functiondef(p.oid) LIKE '%pg_notify%document%';