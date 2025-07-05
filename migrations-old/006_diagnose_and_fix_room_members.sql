-- Comprehensive diagnosis and fix for room_members table issues

-- Step 1: Show all tables related to rooms and members
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%room%member%'
AND table_schema = 'public'
ORDER BY table_name;

-- Step 2: Check if we have the old room_memberships table
DO $$
DECLARE
    has_old_table BOOLEAN;
    has_new_table BOOLEAN;
BEGIN
    -- Check for old table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'room_memberships' 
        AND table_schema = 'public'
    ) INTO has_old_table;
    
    -- Check for new table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'room_members' 
        AND table_schema = 'public'
    ) INTO has_new_table;
    
    RAISE NOTICE 'Has room_memberships (old): %', has_old_table;
    RAISE NOTICE 'Has room_members (new): %', has_new_table;
    
    -- If we have old but not new, rename it
    IF has_old_table AND NOT has_new_table THEN
        ALTER TABLE room_memberships RENAME TO room_members;
        RAISE NOTICE 'Renamed room_memberships to room_members';
    END IF;
END $$;

-- Step 3: Check the current structure of room_members
SELECT 
    'Current room_members columns:' as info;
    
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'room_members'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Fix column names if needed
DO $$
BEGIN
    -- If the table uses 'user_id' instead of 'student_id'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'student_id'
        AND table_schema = 'public'
    ) THEN
        -- First drop any foreign key constraints on user_id
        EXECUTE (
            SELECT string_agg('ALTER TABLE room_members DROP CONSTRAINT ' || constraint_name || ';', E'\n')
            FROM information_schema.table_constraints
            WHERE table_name = 'room_members'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%'
        );
        
        -- Rename the column
        ALTER TABLE room_members RENAME COLUMN user_id TO student_id;
        RAISE NOTICE 'Renamed user_id to student_id';
        
        -- Add the foreign key constraint to students table
        ALTER TABLE room_members 
        ADD CONSTRAINT room_members_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint to students table';
    END IF;
    
    -- If is_archived exists but not is_active
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'is_archived'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        -- Add is_active column with inverse of is_archived
        ALTER TABLE room_members ADD COLUMN is_active BOOLEAN;
        UPDATE room_members SET is_active = NOT COALESCE(is_archived, false);
        ALTER TABLE room_members ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE room_members ALTER COLUMN is_active SET NOT NULL;
        
        -- Drop is_archived
        ALTER TABLE room_members DROP COLUMN is_archived;
        
        RAISE NOTICE 'Replaced is_archived with is_active';
    END IF;
    
    -- Ensure we have the required columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE room_members ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'room_members' 
        AND column_name = 'joined_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE room_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added joined_at column';
    END IF;
END $$;

-- Step 5: Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_room_members_student ON room_members(student_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_active ON room_members(is_active) WHERE is_active = true;

-- Step 6: Show final structure
SELECT 
    'Final room_members structure:' as info;
    
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'room_members'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show constraints
SELECT
    'Foreign key constraints:' as info;
    
SELECT
    tc.constraint_name,
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
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- Step 8: Test the structure
DO $$
DECLARE
    test_room_id UUID;
    test_student_id UUID;
BEGIN
    -- Get a test room and student
    SELECT room_id INTO test_room_id FROM rooms LIMIT 1;
    SELECT student_id INTO test_student_id FROM students LIMIT 1;
    
    IF test_room_id IS NOT NULL AND test_student_id IS NOT NULL THEN
        -- Try to insert a test record
        BEGIN
            INSERT INTO room_members (room_id, student_id, joined_at, is_active)
            VALUES (test_room_id, test_student_id, NOW(), true)
            ON CONFLICT (room_id, student_id) DO NOTHING;
            
            RAISE NOTICE 'Test insert successful';
            
            -- Clean up test record
            DELETE FROM room_members 
            WHERE room_id = test_room_id AND student_id = test_student_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Test insert failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No test data available for insert test';
    END IF;
END $$;

-- Step 9: Grant appropriate permissions
GRANT SELECT ON room_members TO authenticated;
GRANT ALL ON room_members TO service_role;