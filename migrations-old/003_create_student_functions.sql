-- Migration 003: Create Student Management Functions
-- Simple, clean functions for managing students

-- 1. Drop old complex function
DROP FUNCTION IF EXISTS create_student_unified CASCADE;

-- 2. Create simple student creation function
CREATE OR REPLACE FUNCTION create_student(
    p_school_id UUID,
    p_first_name TEXT,
    p_surname TEXT,
    p_year_group TEXT,
    p_username TEXT DEFAULT NULL,
    p_pin_code TEXT DEFAULT NULL,
    p_form_group TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}',
    p_created_by UUID DEFAULT NULL
) RETURNS students AS $$
DECLARE
    v_student students;
    v_auth_user_id UUID;
    v_username TEXT;
    v_pin TEXT;
    v_email TEXT;
    v_created_by UUID;
BEGIN
    -- Ensure we have a created_by value
    v_created_by := COALESCE(p_created_by, auth.uid());
    IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'No authenticated user context - created_by is required';
    END IF;
    
    -- Clean and validate inputs
    p_first_name := TRIM(p_first_name);
    p_surname := TRIM(p_surname);
    p_year_group := TRIM(p_year_group);
    
    IF p_first_name = '' OR p_surname = '' THEN
        RAISE EXCEPTION 'First name and surname are required';
    END IF;
    
    -- Generate username if needed
    v_username := COALESCE(
        NULLIF(TRIM(p_username), ''),
        LOWER(
            LEFT(p_first_name, 1) || 
            REGEXP_REPLACE(p_surname, '[^a-zA-Z0-9]', '', 'g') ||
            TO_CHAR(NOW(), 'YYMMDD') || 
            LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0')
        )
    );
    
    -- Generate PIN if needed
    v_pin := COALESCE(
        NULLIF(TRIM(p_pin_code), ''),
        LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
    );
    
    -- Generate email using school domain
    v_email := v_username || '@' || p_school_id || '.local';
    
    -- Create auth user
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        v_email,
        crypt(v_pin, gen_salt('bf')),
        NOW(),
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']::text[]
        ),
        jsonb_build_object(
            'role', 'student',
            'full_name', p_first_name || ' ' || p_surname,
            'username', v_username,
            'school_id', p_school_id
        ),
        'authenticated',
        'authenticated'
    ) RETURNING id INTO v_auth_user_id;
    
    -- Create student record
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
        created_by
    ) VALUES (
        p_school_id,
        v_auth_user_id,
        p_first_name,
        p_surname,
        v_username,
        v_pin,
        p_year_group,
        p_form_group,
        p_tags,
        v_created_by
    ) RETURNING * INTO v_student;
    
    RETURN v_student;
    
EXCEPTION
    WHEN unique_violation THEN
        IF SQLERRM LIKE '%students_username_school_unique%' THEN
            RAISE EXCEPTION 'Username % already exists in this school', v_username;
        ELSIF SQLERRM LIKE '%auth_users_email_key%' THEN
            RAISE EXCEPTION 'Email % already exists', v_email;
        ELSE
            RAISE;
        END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to add student to room
CREATE OR REPLACE FUNCTION add_student_to_room(
    p_student_id UUID,
    p_room_id UUID
) RETURNS room_members AS $$
DECLARE
    v_result room_members;
BEGIN
    INSERT INTO room_members (student_id, room_id, joined_at, is_active)
    VALUES (p_student_id, p_room_id, NOW(), true)
    ON CONFLICT (student_id, room_id) 
    DO UPDATE SET 
        is_active = true,
        joined_at = CASE 
            WHEN room_members.is_active = false 
            THEN NOW() 
            ELSE room_members.joined_at 
        END
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to remove student from room
CREATE OR REPLACE FUNCTION remove_student_from_room(
    p_student_id UUID,
    p_room_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE room_members 
    SET is_active = false
    WHERE student_id = p_student_id 
    AND room_id = p_room_id
    AND is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to get student by username and school
CREATE OR REPLACE FUNCTION get_student_by_username(
    p_username TEXT,
    p_school_id UUID
) RETURNS students AS $$
    SELECT * FROM students 
    WHERE username = LOWER(TRIM(p_username))
    AND school_id = p_school_id
    AND is_active = true
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Function to update student PIN
CREATE OR REPLACE FUNCTION update_student_pin(
    p_student_id UUID,
    p_new_pin TEXT,
    p_changed_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_auth_user_id UUID;
BEGIN
    -- Get the auth user id
    SELECT auth_user_id INTO v_auth_user_id
    FROM students 
    WHERE student_id = p_student_id;
    
    IF v_auth_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_pin, gen_salt('bf'))
    WHERE id = v_auth_user_id;
    
    -- Update in students table
    UPDATE students
    SET pin_code = p_new_pin,
        updated_at = NOW()
    WHERE student_id = p_student_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Bulk create students (for CSV upload)
CREATE OR REPLACE FUNCTION bulk_create_students(
    p_school_id UUID,
    p_students JSONB,
    p_created_by UUID DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    student_id UUID,
    username TEXT,
    error TEXT
) AS $$
DECLARE
    v_student JSONB;
    v_result students;
    v_error TEXT;
BEGIN
    -- Loop through each student in the array
    FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
    LOOP
        BEGIN
            -- Try to create the student
            v_result := create_student(
                p_school_id,
                v_student->>'first_name',
                v_student->>'surname',
                v_student->>'year_group',
                v_student->>'username',
                v_student->>'pin_code',
                v_student->>'form_group',
                NULL, -- tags
                p_created_by
            );
            
            RETURN QUERY SELECT 
                true,
                v_result.student_id,
                v_result.username,
                NULL::TEXT;
                
        EXCEPTION WHEN OTHERS THEN
            -- Return error for this student
            RETURN QUERY SELECT 
                false,
                NULL::UUID,
                v_student->>'username',
                SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION create_student TO authenticated;
GRANT EXECUTE ON FUNCTION add_student_to_room TO authenticated;
GRANT EXECUTE ON FUNCTION remove_student_from_room TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_by_username TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_pin TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_create_students TO authenticated;