-- Check and fix room_members table structure

-- 1. Check current structure of room_members table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'room_members'
ORDER BY ordinal_position;

-- 2. Check if there's a legacy room_memberships table
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_name IN ('room_members', 'room_memberships')
AND table_schema = 'public';

-- 3. If room_members has wrong column names, fix them
DO $$
BEGIN
    -- Check if room_members exists but has user_id instead of student_id
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'user_id'
    ) THEN
        -- Rename user_id to student_id
        ALTER TABLE room_members RENAME COLUMN user_id TO student_id;
        RAISE NOTICE 'Renamed user_id to student_id in room_members table';
    END IF;
    
    -- Check if room_members doesn't exist at all
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'room_members' 
        AND table_schema = 'public'
    ) THEN
        -- Create the table as per our schema
        CREATE TABLE room_members (
            room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (room_id, student_id)
        );
        
        CREATE INDEX idx_room_members_student ON room_members(student_id);
        CREATE INDEX idx_room_members_active ON room_members(is_active) WHERE is_active = true;
        
        RAISE NOTICE 'Created room_members table with correct structure';
    END IF;
    
    -- Ensure student_id column exists and has proper reference
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'student_id'
    ) THEN
        RAISE EXCEPTION 'room_members table exists but missing student_id column - manual intervention required';
    END IF;
END $$;

-- 4. Verify the final structure
SELECT 
    'Final room_members structure:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'room_members'
ORDER BY ordinal_position;

-- 5. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'room_members'
    AND tc.constraint_type = 'FOREIGN KEY';