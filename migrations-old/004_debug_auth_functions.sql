-- Debug function to check auth user existence
CREATE OR REPLACE FUNCTION debug_check_auth_user(p_email TEXT)
RETURNS TABLE (
    exists BOOLEAN,
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    user_metadata JSONB
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as exists,
        id as user_id,
        auth.users.email,
        auth.users.created_at,
        auth.users.raw_user_meta_data as user_metadata
    FROM auth.users
    WHERE auth.users.email = p_email
    LIMIT 1;
    
    -- If no user found, return null row
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            false as exists,
            NULL::UUID as user_id,
            p_email as email,
            NULL::TIMESTAMPTZ as created_at,
            NULL::JSONB as user_metadata;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to fix orphaned student auth
CREATE OR REPLACE FUNCTION fix_student_auth(p_username TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student students;
    v_email TEXT;
    v_auth_user auth.users;
    v_result JSONB;
BEGIN
    -- Get student
    SELECT * INTO v_student
    FROM students
    WHERE username = LOWER(TRIM(p_username))
    LIMIT 1;
    
    IF v_student IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Student not found'
        );
    END IF;
    
    -- Build email
    v_email := v_student.username || '@' || v_student.school_id || '.local';
    
    -- Check if auth user exists
    SELECT * INTO v_auth_user
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;
    
    IF v_auth_user IS NOT NULL THEN
        -- Auth user exists - update student record
        UPDATE students
        SET auth_user_id = v_auth_user.id
        WHERE student_id = v_student.student_id;
        
        -- Update auth user password to match PIN
        UPDATE auth.users
        SET encrypted_password = crypt(v_student.pin_code, gen_salt('bf'))
        WHERE id = v_auth_user.id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Found and linked existing auth user',
            'student_id', v_student.student_id,
            'auth_user_id', v_auth_user.id,
            'email', v_email,
            'pin_updated', true
        );
    ELSE
        -- Try to create auth user
        BEGIN
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
                crypt(v_student.pin_code, gen_salt('bf')),
                NOW(),
                jsonb_build_object(
                    'provider', 'email',
                    'providers', ARRAY['email']::text[]
                ),
                jsonb_build_object(
                    'role', 'student',
                    'full_name', v_student.first_name || ' ' || v_student.surname,
                    'username', v_student.username,
                    'school_id', v_student.school_id
                ),
                'authenticated',
                'authenticated'
            ) RETURNING * INTO v_auth_user;
            
            -- Update student with auth_user_id
            UPDATE students
            SET auth_user_id = v_auth_user.id
            WHERE student_id = v_student.student_id;
            
            RETURN jsonb_build_object(
                'success', true,
                'message', 'Created new auth user',
                'student_id', v_student.student_id,
                'auth_user_id', v_auth_user.id,
                'email', v_email
            );
            
        EXCEPTION WHEN unique_violation THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Auth user already exists but could not be found',
                'email', v_email
            );
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION debug_check_auth_user TO authenticated;
GRANT EXECUTE ON FUNCTION fix_student_auth TO authenticated;