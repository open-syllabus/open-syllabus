-- Create lesson_resources table
CREATE TABLE lesson_resources (
  resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  upload_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX idx_lesson_resources_lesson_id ON lesson_resources(lesson_id);
CREATE INDEX idx_lesson_resources_created_at ON lesson_resources(created_at);

-- Set up RLS (Row Level Security)
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can manage resources for their own lessons
CREATE POLICY "Teachers can manage lesson resources" ON lesson_resources
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN courses c ON cl.course_id = c.course_id
    WHERE cl.lesson_id = lesson_resources.lesson_id
    AND c.teacher_id = auth.uid()
  )
);

-- Policy: Students can view resources for lessons they have access to
CREATE POLICY "Students can view lesson resources" ON lesson_resources
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN courses c ON cl.course_id = c.course_id
    JOIN room_courses rc ON c.course_id = rc.course_id
    JOIN room_members rm ON rc.room_id = rm.room_id
    JOIN students s ON rm.student_id = s.student_id
    WHERE cl.lesson_id = lesson_resources.lesson_id
    AND s.auth_user_id = auth.uid()
    AND c.is_published = true
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lesson_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_lesson_resources_updated_at
  BEFORE UPDATE ON lesson_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_resources_updated_at();