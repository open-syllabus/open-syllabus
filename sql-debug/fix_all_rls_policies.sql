-- Fix all RLS policies to use correct tables: teacher_profiles and students

-- 1. Fix course_enrollments table
-- First, check the existing policy
SELECT policyname, with_check FROM pg_policies WHERE tablename = 'course_enrollments' AND policyname = 'Students can enroll in published courses';

-- Drop and recreate if it references student_profiles
DROP POLICY IF EXISTS "Students can enroll in published courses" ON course_enrollments;

CREATE POLICY "Students can enroll in published courses" ON course_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.student_id = course_enrollments.student_id
    AND s.auth_user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_enrollments.course_id
    AND c.is_published = true
  )
);

-- 2. Fix flagged_messages table
DROP POLICY IF EXISTS "FLAGGED_MESSAGES_SELECT_TEACHER_OWN" ON flagged_messages;
DROP POLICY IF EXISTS "FLAGGED_MESSAGES_UPDATE_TEACHER_OWN" ON flagged_messages;

-- Teachers can select flagged messages from their rooms
CREATE POLICY "Teachers can select flagged messages" ON flagged_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM rooms r
    JOIN teacher_profiles tp ON tp.user_id = r.teacher_id
    WHERE r.room_id = flagged_messages.room_id
    AND tp.user_id = auth.uid()
  )
);

-- Teachers can update flagged messages from their rooms
CREATE POLICY "Teachers can update flagged messages" ON flagged_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM rooms r
    JOIN teacher_profiles tp ON tp.user_id = r.teacher_id
    WHERE r.room_id = flagged_messages.room_id
    AND tp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM rooms r
    JOIN teacher_profiles tp ON tp.user_id = r.teacher_id
    WHERE r.room_id = flagged_messages.room_id
    AND tp.user_id = auth.uid()
  )
);

-- 3. Fix rooms table policies
DROP POLICY IF EXISTS "ZZZ_INSERT_TeacherRooms" ON rooms;
DROP POLICY IF EXISTS "ZZZ_SELECT_StudentCanViewActiveRoomsForJoining" ON rooms;
DROP POLICY IF EXISTS "emergency_teacher_only_access" ON rooms;

-- Teachers can insert rooms
CREATE POLICY "Teachers can create rooms" ON rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.user_id = rooms.teacher_id
  )
);

-- Students can view active rooms for joining
CREATE POLICY "Students can view active rooms for joining" ON rooms
FOR SELECT
TO authenticated
USING (
  rooms.is_active = true
  AND EXISTS (
    SELECT 1 FROM students s
    WHERE s.auth_user_id = auth.uid()
  )
);

-- Teachers have full access to their own rooms
CREATE POLICY "Teachers have full access to their rooms" ON rooms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.user_id = rooms.teacher_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.user_id = rooms.teacher_id
  )
);

-- 4. Fix student_assessments table
DROP POLICY IF EXISTS "Teachers can select assessments for their chatbots" ON student_assessments;

CREATE POLICY "Teachers can view assessments for their students" ON student_assessments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM room_members rm
    JOIN rooms r ON r.room_id = rm.room_id
    JOIN teacher_profiles tp ON tp.user_id = r.teacher_id
    WHERE rm.student_id = student_assessments.student_id
    AND tp.user_id = auth.uid()
  )
);

-- 5. Fix student_learning_profiles table
-- First check what this policy looks like
SELECT policyname, qual FROM pg_policies WHERE tablename = 'student_learning_profiles' AND policyname = 'Teachers can view student profiles in their rooms';

DROP POLICY IF EXISTS "Teachers can view student profiles in their rooms" ON student_learning_profiles;

CREATE POLICY "Teachers can view student profiles in their rooms" ON student_learning_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM room_members rm
    JOIN rooms r ON r.room_id = rm.room_id
    JOIN teacher_profiles tp ON tp.user_id = r.teacher_id
    WHERE rm.student_id = student_learning_profiles.student_id
    AND tp.user_id = auth.uid()
  )
);

-- 6. Fix student_profiles table (this table should probably be renamed to avoid confusion with students table)
DROP POLICY IF EXISTS "Teachers can view their students" ON student_profiles;

-- Note: student_profiles seems to be a legacy table. 
-- The policy should probably check against the students table for the relationship
CREATE POLICY "Teachers can view their students" ON student_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM room_members rm
    JOIN rooms r ON r.room_id = rm.room_id
    JOIN teacher_profiles tp ON tp.user_id = r.teacher_id
    JOIN students s ON s.student_id = rm.student_id
    WHERE s.auth_user_id = student_profiles.user_id  -- Assuming student_profiles.user_id maps to students.auth_user_id
    AND tp.user_id = auth.uid()
  )
);

-- Verify all policies were updated
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%profiles_old%' OR with_check::text LIKE '%profiles_old%' THEN 'STILL HAS profiles_old!'
        WHEN qual::text LIKE '%student_profiles%' OR with_check::text LIKE '%student_profiles%' THEN 'STILL HAS student_profiles!'
        ELSE 'Fixed'
    END as status
FROM pg_policies
WHERE tablename IN ('course_enrollments', 'flagged_messages', 'rooms', 'student_assessments', 'student_learning_profiles', 'student_profiles')
ORDER BY tablename, policyname;