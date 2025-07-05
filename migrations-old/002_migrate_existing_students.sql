-- Migration 002: Migrate Existing Student Data
-- This migrates all existing students to the new structure

-- 1. First, check what we're migrating
SELECT 'Students to migrate:' as info, COUNT(*) as count FROM student_profiles WHERE school_id IS NOT NULL;

-- 2. Migrate all existing students from student_profiles
INSERT INTO students (
    school_id,
    auth_user_id,
    first_name,
    surname,
    username,
    pin_code,
    year_group,
    form_group,
    tags,
    is_active,
    created_by,
    created_at,
    updated_at
)
SELECT 
    sp.school_id,
    sp.user_id as auth_user_id,
    COALESCE(
        NULLIF(TRIM(sp.first_name), ''), 
        SPLIT_PART(COALESCE(sp.full_name, 'Unknown Student'), ' ', 1),
        'Unknown'
    ) as first_name,
    COALESCE(
        NULLIF(TRIM(sp.surname), ''), 
        CASE 
            WHEN POSITION(' ' IN COALESCE(sp.full_name, '')) > 0 
            THEN SUBSTRING(sp.full_name FROM POSITION(' ' IN sp.full_name) + 1)
            ELSE 'Student'
        END,
        'Student'
    ) as surname,
    COALESCE(
        NULLIF(TRIM(sp.username), ''), 
        'legacy_' || LEFT(sp.user_id::text, 8)
    ) as username,
    COALESCE(
        NULLIF(TRIM(sp.pin_code), ''), 
        LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
    ) as pin_code,
    COALESCE(
        NULLIF(TRIM(sp.year_group), ''), 
        'Unknown'
    ) as year_group,
    NULL as form_group, -- Will need to be updated from master_students if exists
    '{}' as tags,
    true as is_active,
    COALESCE(sp.pin_change_by, sp.user_id) as created_by,
    COALESCE(sp.created_at, NOW()) as created_at,
    COALESCE(sp.updated_at, NOW()) as updated_at
FROM student_profiles sp
WHERE sp.school_id IS NOT NULL
ON CONFLICT (auth_user_id) DO NOTHING; -- Skip if already migrated

-- 3. Report migration results
SELECT 'Students migrated:' as info, COUNT(*) as count FROM students;

-- 4. Migrate room memberships to new structure
INSERT INTO room_members (room_id, student_id, joined_at, is_active)
SELECT 
    rm.room_id,
    s.student_id,
    COALESCE(rm.joined_at, NOW()),
    COALESCE(NOT rm.is_archived, true) as is_active
FROM room_memberships rm
JOIN students s ON s.auth_user_id = rm.student_id
ON CONFLICT (room_id, student_id) DO NOTHING;

-- 5. Report room membership migration
SELECT 'Room memberships migrated:' as info, COUNT(*) as count FROM room_members;

-- 6. Create a mapping table for reference during migration
CREATE TABLE IF NOT EXISTS student_migration_map (
    old_user_id UUID PRIMARY KEY,
    new_student_id UUID NOT NULL REFERENCES students(student_id),
    migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Populate the mapping table
INSERT INTO student_migration_map (old_user_id, new_student_id)
SELECT auth_user_id, student_id 
FROM students
ON CONFLICT (old_user_id) DO NOTHING;

-- 8. Add any missing students that might be in auth.users but not in student_profiles
INSERT INTO students (
    school_id,
    auth_user_id,
    first_name,
    surname,
    username,
    pin_code,
    year_group,
    created_by
)
SELECT 
    'a11333e1-5cd5-4a3f-ae30-843104fddc52'::uuid as school_id, -- Default to Park View School, update as needed
    u.id as auth_user_id,
    COALESCE(
        SPLIT_PART(u.raw_user_meta_data->>'full_name', ' ', 1),
        'Unknown'
    ) as first_name,
    COALESCE(
        CASE 
            WHEN POSITION(' ' IN COALESCE(u.raw_user_meta_data->>'full_name', '')) > 0 
            THEN SUBSTRING(u.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN u.raw_user_meta_data->>'full_name') + 1)
            ELSE 'Student'
        END,
        'Student'
    ) as surname,
    COALESCE(
        u.raw_user_meta_data->>'username',
        'orphan_' || LEFT(u.id::text, 8)
    ) as username,
    LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0') as pin_code,
    'Unknown' as year_group,
    u.id as created_by
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'student'
AND NOT EXISTS (SELECT 1 FROM students s WHERE s.auth_user_id = u.id)
AND u.email NOT LIKE '%@skolr.local'; -- Skip our test users

-- 9. Final report
SELECT 
    'Final Student Count' as metric,
    COUNT(*) as total,
    COUNT(DISTINCT school_id) as schools,
    COUNT(DISTINCT year_group) as year_groups
FROM students;