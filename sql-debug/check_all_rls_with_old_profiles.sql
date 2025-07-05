-- Find all RLS policies that reference profiles_old or other outdated tables
-- The correct tables are: teacher_profiles and students
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    -- Show if policy references old/incorrect tables
    CASE 
        WHEN qual::text LIKE '%profiles_old%' THEN 'References profiles_old (should use teacher_profiles or students)'
        WHEN qual::text LIKE '%student_profiles%' THEN 'References student_profiles (should use students)'
        WHEN qual::text LIKE '%profiles%' AND qual::text NOT LIKE '%teacher_profiles%' THEN 'References profiles table'
        WHEN with_check::text LIKE '%profiles_old%' THEN 'References profiles_old in WITH CHECK'
        WHEN with_check::text LIKE '%student_profiles%' THEN 'References student_profiles in WITH CHECK'
        WHEN with_check::text LIKE '%profiles%' AND with_check::text NOT LIKE '%teacher_profiles%' THEN 'References profiles in WITH CHECK'
        ELSE 'Check manually'
    END as issue
FROM pg_policies
WHERE 
    qual::text LIKE '%profiles_old%' OR
    qual::text LIKE '%student_profiles%' OR
    (qual::text LIKE '%profiles%' AND qual::text NOT LIKE '%teacher_profiles%') OR
    with_check::text LIKE '%profiles_old%' OR
    with_check::text LIKE '%student_profiles%' OR
    (with_check::text LIKE '%profiles%' AND with_check::text NOT LIKE '%teacher_profiles%')
ORDER BY tablename, policyname;