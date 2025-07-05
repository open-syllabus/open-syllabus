-- Check RLS policies on documents table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY policyname;

-- Check if RLS is enabled on documents table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'documents';

-- Check current user
SELECT current_user, session_user;

-- Check if we're using the service role
SELECT current_setting('request.jwt.claims', true)::json->>'role' as jwt_role;