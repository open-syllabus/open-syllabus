-- Migration 001: Create New Student Structure
-- This creates the new clean student system

-- 1. Create new students table (the ONE source of truth)
CREATE TABLE IF NOT EXISTS students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Core student data
    first_name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    
    -- School organization
    year_group VARCHAR(50) NOT NULL,
    form_group VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT students_username_school_unique UNIQUE(school_id, username)
);

-- 2. Create clean room membership table
CREATE TABLE IF NOT EXISTS room_members (
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    PRIMARY KEY (room_id, student_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_auth_user ON students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_room_members_student ON room_members(student_id);
CREATE INDEX IF NOT EXISTS idx_room_members_active ON room_members(is_active) WHERE is_active = true;

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add helpful comments
COMMENT ON TABLE students IS 'Single source of truth for all student data';
COMMENT ON TABLE room_members IS 'Links students to rooms they are members of';
COMMENT ON COLUMN students.auth_user_id IS 'Link to auth.users for authentication only';
COMMENT ON COLUMN students.tags IS 'Flexible tagging system for organizing students';

-- 6. Grant appropriate permissions (adjust based on your roles)
GRANT SELECT ON students TO authenticated;
GRANT ALL ON students TO service_role;