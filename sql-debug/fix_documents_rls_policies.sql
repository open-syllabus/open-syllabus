-- Drop all existing RLS policies on documents table
DROP POLICY IF EXISTS "Students can view documents for chatbots in their rooms" ON documents;
DROP POLICY IF EXISTS "Teachers can delete documents for their own chatbots" ON documents;
DROP POLICY IF EXISTS "Teachers can insert documents for their own chatbots" ON documents;
DROP POLICY IF EXISTS "Teachers can select documents for their own chatbots" ON documents;
DROP POLICY IF EXISTS "Teachers can update documents for their own chatbots" ON documents;

-- Create new RLS policies using the correct tables (teacher_profiles and students)

-- Teachers can view their own chatbot documents
CREATE POLICY "Teachers can view documents for their chatbots" ON documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM chatbots cb
    JOIN teacher_profiles tp ON tp.user_id = cb.teacher_id
    WHERE cb.chatbot_id = documents.chatbot_id 
    AND tp.user_id = auth.uid()
  )
);

-- Teachers can insert documents for their chatbots
CREATE POLICY "Teachers can insert documents for their chatbots" ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM chatbots cb
    JOIN teacher_profiles tp ON tp.user_id = cb.teacher_id
    WHERE cb.chatbot_id = documents.chatbot_id 
    AND tp.user_id = auth.uid()
  )
);

-- Teachers can update their chatbot documents
CREATE POLICY "Teachers can update documents for their chatbots" ON documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM chatbots cb
    JOIN teacher_profiles tp ON tp.user_id = cb.teacher_id
    WHERE cb.chatbot_id = documents.chatbot_id 
    AND tp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM chatbots cb
    JOIN teacher_profiles tp ON tp.user_id = cb.teacher_id
    WHERE cb.chatbot_id = documents.chatbot_id 
    AND tp.user_id = auth.uid()
  )
);

-- Teachers can delete their chatbot documents
CREATE POLICY "Teachers can delete documents for their chatbots" ON documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM chatbots cb
    JOIN teacher_profiles tp ON tp.user_id = cb.teacher_id
    WHERE cb.chatbot_id = documents.chatbot_id 
    AND tp.user_id = auth.uid()
  )
);

-- Students can view documents for chatbots in their rooms
CREATE POLICY "Students can view documents in their rooms" ON documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM room_members rm
    JOIN room_chatbots rc ON rc.room_id = rm.room_id
    JOIN students s ON s.student_id = rm.student_id
    WHERE s.auth_user_id = auth.uid()
    AND rc.chatbot_id = documents.chatbot_id
  )
);

-- Verify the new policies
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