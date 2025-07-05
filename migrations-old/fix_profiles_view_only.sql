-- Fix profiles view - recreate without SECURITY DEFINER (even though it doesn't seem to have it)
-- This keeps the EXACT same definition

DROP VIEW IF EXISTS public.profiles CASCADE;

CREATE VIEW public.profiles AS
 SELECT teacher_profiles.user_id,
    teacher_profiles.email,
    teacher_profiles.full_name,
    'teacher'::text AS role,
    teacher_profiles.created_at,
    teacher_profiles.updated_at,
    teacher_profiles.school_id,
    teacher_profiles.country_code,
    NULL::character varying(4) AS pin_code,
    NULL::character varying(50) AS username,
    NULL::timestamp with time zone AS last_pin_change,
    NULL::uuid AS pin_change_by
   FROM teacher_profiles
UNION ALL
 SELECT student_profiles.user_id,
    ''::text AS email,
    student_profiles.full_name,
    'student'::text AS role,
    student_profiles.created_at,
    student_profiles.updated_at,
    student_profiles.school_id,
    student_profiles.country_code,
    student_profiles.pin_code,
    student_profiles.username,
    student_profiles.last_pin_change,
    student_profiles.pin_change_by
   FROM student_profiles;

-- Restore the exact same permissions
GRANT SELECT ON public.profiles TO PUBLIC;
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;