-- Fix study_guides foreign key to reference auth.users instead of student_profiles
-- Since we're only using the students table now, and study_guides needs the auth user ID

-- First, drop the existing foreign key constraint
ALTER TABLE study_guides 
DROP CONSTRAINT IF EXISTS study_guides_student_id_fkey;

-- Add new foreign key constraint to auth.users
ALTER TABLE study_guides 
ADD CONSTRAINT study_guides_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_study_guides_student_id ON study_guides(student_id);

-- Do the same for study_guide_podcasts if it exists
ALTER TABLE study_guide_podcasts 
DROP CONSTRAINT IF EXISTS study_guide_podcasts_student_id_fkey;

ALTER TABLE study_guide_podcasts 
ADD CONSTRAINT study_guide_podcasts_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_study_guide_podcasts_student_id ON study_guide_podcasts(student_id);

-- Also fix student_notebooks if needed
ALTER TABLE student_notebooks 
DROP CONSTRAINT IF EXISTS student_notebooks_student_id_fkey;

ALTER TABLE student_notebooks 
ADD CONSTRAINT student_notebooks_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_student_notebooks_student_id ON student_notebooks(student_id);