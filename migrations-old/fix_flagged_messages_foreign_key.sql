-- Migration to fix flagged_messages foreign key constraint
-- The table currently references student_profiles which no longer exists
-- We need to update it to reference the students table

-- First, drop the existing foreign key constraint
ALTER TABLE flagged_messages 
DROP CONSTRAINT IF EXISTS fk_student;

-- Add the new foreign key constraint to the students table
ALTER TABLE flagged_messages
ADD CONSTRAINT fk_student 
FOREIGN KEY (student_id) 
REFERENCES students(student_id) 
ON DELETE CASCADE;

-- Also ensure the teacher foreign key is correct
ALTER TABLE flagged_messages
DROP CONSTRAINT IF EXISTS fk_teacher;

ALTER TABLE flagged_messages
ADD CONSTRAINT fk_teacher
FOREIGN KEY (teacher_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Ensure room foreign key is correct
ALTER TABLE flagged_messages
DROP CONSTRAINT IF EXISTS fk_room;

ALTER TABLE flagged_messages
ADD CONSTRAINT fk_room
FOREIGN KEY (room_id)
REFERENCES rooms(room_id)
ON DELETE CASCADE;