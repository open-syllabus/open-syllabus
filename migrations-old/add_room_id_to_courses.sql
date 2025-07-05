-- Add room_id to courses table to link courses to rooms
ALTER TABLE courses 
ADD COLUMN room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_courses_room_id ON courses(room_id);

-- Update existing courses to be null (they're not associated with any room)
-- This is already the default since we didn't specify NOT NULL