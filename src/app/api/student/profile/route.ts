import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function GET() {
  try {
    console.log('[Profile API] Starting request')
    const supabase = await createServerSupabaseClient()
    const supabaseAdmin = createAdminClient()
    const headersList = await headers()
    
    // Check for direct access headers first
    const directStudentId = headersList.get('x-student-id')
    const directSchoolId = headersList.get('x-school-id')
    
    let studentProfile = null
    
    if (directStudentId && directSchoolId) {
      console.log('[Profile API] Using direct access:', { studentId: directStudentId, schoolId: directSchoolId })
      
      // Direct access mode - fetch by student_id
      const { data, error } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('student_id', directStudentId)
        .eq('school_id', directSchoolId)
        .single()
      
      if (error || !data) {
        console.error('[Profile API] Direct access profile error:', error)
        console.error('[Profile API] Query details:', {
          table: 'students',
          studentId: directStudentId,
          schoolId: directSchoolId
        })
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      
      studentProfile = data
    } else {
      // Regular auth mode
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('[Profile API] Auth check:', { userId: user?.id, error: authError })
      
      if (authError || !user) {
        console.error('[Profile API] Auth error:', authError)
        return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
      }
      
      // For PIN-based student logins, the username is stored in user metadata
      const username = user.user_metadata?.username || user.email?.split('@')[0]
      console.log('[Profile API] Looking for student with username:', username)
      
      // First try to find by auth_user_id
      let { data, error } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
      
      // If not found by auth_user_id, try username
      if (!data && username) {
        console.log('[Profile API] Not found by auth_user_id, trying username:', username)
        const usernameResult = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('username', username)
          .single()
        
        data = usernameResult.data
        error = usernameResult.error
      }
      
      if (error || !data) {
        console.error('[Profile API] Student profile not found:', error)
        console.error('[Profile API] Search details:', {
          auth_user_id: user.id,
          username: username,
          userEmail: user.email
        })
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      
      studentProfile = data
    }
    
    // Fetch school information separately if the student has a school_id
    if (studentProfile.school_id) {
      const { data: schoolData } = await supabaseAdmin
        .from('schools')
        .select('school_name, school_code')
        .eq('school_id', studentProfile.school_id)
        .single()
      
      if (schoolData) {
        studentProfile.schools = schoolData
      }
    }
    
    console.log('[Profile API] Profile loaded successfully:', {
      student_id: studentProfile.student_id,
      username: studentProfile.username,
      hasSchool: !!studentProfile.schools
    })
    
    return NextResponse.json(studentProfile)
    
  } catch (error) {
    console.error('[Profile API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[Profile API] Update request')
    const supabase = await createServerSupabaseClient()
    const supabaseAdmin = createAdminClient()
    const headersList = await headers()
    const body = await request.json()
    
    // Check for direct access headers first
    const directStudentId = headersList.get('x-student-id')
    const directSchoolId = headersList.get('x-school-id')
    
    let updateQuery
    
    if (directStudentId && directSchoolId) {
      console.log('[Profile API] Updating via direct access:', { studentId: directStudentId })
      
      // Direct access mode - update by student_id
      updateQuery = supabaseAdmin
        .from('students')
        .update({
          first_name: body.first_name,
          surname: body.surname,
          year_group: body.year_group
        })
        .eq('student_id', directStudentId)
        .eq('school_id', directSchoolId)
    } else {
      // Regular auth mode
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('[Profile API] Auth error:', authError)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Update by auth_user_id
      updateQuery = supabaseAdmin
        .from('students')
        .update({
          first_name: body.first_name,
          surname: body.surname,
          year_group: body.year_group,
          email: body.email // Email can only be updated in auth mode
        })
        .eq('auth_user_id', user.id)
        
      // Handle password and email updates for auth users
      if (body.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: body.new_password
        })
        
        if (passwordError) {
          console.error('[Profile API] Password update error:', passwordError)
          return NextResponse.json({ error: 'Failed to update password' }, { status: 400 })
        }
      }
      
      if (body.email && body.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: body.email
        })
        
        if (emailError) {
          console.error('[Profile API] Email update error:', emailError)
          return NextResponse.json({ error: 'Failed to update email' }, { status: 400 })
        }
      }
    }
    
    const { error: updateError } = await updateQuery
    
    if (updateError) {
      console.error('[Profile API] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[Profile API] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}