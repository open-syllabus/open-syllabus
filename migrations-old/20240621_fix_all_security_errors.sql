-- Migration to fix all 4 Supabase security errors
-- Date: 2024-06-21

-- ========================================
-- STEP 1: Recreate views explicitly without SECURITY DEFINER
-- ========================================
-- Even though they show as SECURITY INVOKER, let's recreate them to ensure the linter is satisfied

-- Drop and recreate profiles view
-- IMPORTANT: Updating to use 'students' table instead of deprecated 'student_profiles'
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
SELECT students.auth_user_id AS user_id,
    students.email AS email,
    CONCAT(students.first_name, ' ', students.surname) AS full_name,
    'student'::text AS role,
    students.created_at,
    students.created_at AS updated_at,
    students.school_id,
    NULL::character varying(3) AS country_code,
    students.pin_code,
    students.username,
    students.last_pin_change,
    students.pin_change_by
FROM students;

-- Restore all permissions on profiles view
GRANT SELECT ON public.profiles TO PUBLIC;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;

-- Drop and recreate super_admin_dashboard view
DROP VIEW IF EXISTS public.super_admin_dashboard CASCADE;

CREATE VIEW public.super_admin_dashboard AS
SELECT ( SELECT count(*) AS count
           FROM schools) AS total_schools,
    ( SELECT count(*) AS count
           FROM schools
          WHERE schools.subscription_tier::text <> 'free'::text) AS paid_schools,
    ( SELECT count(*) AS count
           FROM teacher_profiles) AS total_teachers,
    ( SELECT count(*) AS count
           FROM master_students) AS total_students,
    ( SELECT count(*) AS count
           FROM admin_verification_requests
          WHERE admin_verification_requests.status::text = 'pending'::text) AS pending_verifications,
    ( SELECT count(*) AS count
           FROM school_admins) AS total_admins;

-- Restore all permissions on super_admin_dashboard view
GRANT ALL ON public.super_admin_dashboard TO anon;
GRANT ALL ON public.super_admin_dashboard TO authenticated;
GRANT ALL ON public.super_admin_dashboard TO postgres;
GRANT ALL ON public.super_admin_dashboard TO service_role;

-- ========================================
-- STEP 2: Enable RLS on room_members table
-- ========================================
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for room_members
-- Teachers can see and manage members in their rooms
CREATE POLICY "Teachers manage their room members" ON public.room_members
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rooms 
            WHERE rooms.room_id = room_members.room_id 
            AND rooms.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rooms 
            WHERE rooms.room_id = room_members.room_id 
            AND rooms.teacher_id = auth.uid()
        )
    );

-- Students can see their own memberships
CREATE POLICY "Students view own memberships" ON public.room_members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.student_id = room_members.student_id 
            AND students.auth_user_id = auth.uid()
        )
    );

-- Service role has full access
CREATE POLICY "Service role full access room_members" ON public.room_members
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- STEP 3: Enable RLS on students table
-- ========================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students can view and update their own record
CREATE POLICY "Students manage own record" ON public.students
    FOR ALL
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Teachers can view all students in their school
CREATE POLICY "Teachers view school students" ON public.students
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles 
            WHERE teacher_profiles.user_id = auth.uid()
            AND teacher_profiles.school_id = students.school_id
        )
    );

-- Teachers can insert/update/delete students in their school
CREATE POLICY "Teachers manage school students" ON public.students
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teacher_profiles 
            WHERE teacher_profiles.user_id = auth.uid()
            AND teacher_profiles.school_id = students.school_id
        )
    );

CREATE POLICY "Teachers update school students" ON public.students
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles 
            WHERE teacher_profiles.user_id = auth.uid()
            AND teacher_profiles.school_id = students.school_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teacher_profiles 
            WHERE teacher_profiles.user_id = auth.uid()
            AND teacher_profiles.school_id = students.school_id
        )
    );

CREATE POLICY "Teachers delete school students" ON public.students
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles 
            WHERE teacher_profiles.user_id = auth.uid()
            AND teacher_profiles.school_id = students.school_id
        )
    );

-- Service role has full access
CREATE POLICY "Service role full access students" ON public.students
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- Verification
-- ========================================
-- After running this, the Supabase linter should show all 4 errors as resolved