-- Create function to securely check if a student has access to a course
CREATE OR REPLACE FUNCTION check_student_course_access(
  p_course_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM room_courses rc
    INNER JOIN room_members rm ON rc.room_id = rm.room_id
    WHERE rc.course_id = p_course_id 
    AND rm.student_id = p_student_id 
    AND rm.is_active = true
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_student_course_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_student_course_access(UUID, UUID) TO service_role;