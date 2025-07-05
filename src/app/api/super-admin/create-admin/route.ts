import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/super-admin/create-admin - Create an admin for any school
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      school_id, 
      school_name, // For creating new school if school_id not provided
      is_primary = false,
      permissions = {
        manage_students: true,
        manage_teachers: true,
        manage_billing: false,
        view_analytics: true
      }
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let finalSchoolId = school_id;

    // If no school_id provided, create a new school
    if (!finalSchoolId && school_name) {
      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: school_name })
        .select()
        .single();

      if (schoolError) {
        console.error('Error creating school:', schoolError);
        return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
      }

      finalSchoolId = newSchool.school_id;
    }

    if (!finalSchoolId) {
      return NextResponse.json({ 
        error: 'Either school_id or school_name is required' 
      }, { status: 400 });
    }

    // Find or create user
    let userId;
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // User doesn't exist - create invitation instead
      const { data: invitation, error: inviteError } = await supabase
        .from('admin_invitations')
        .insert({
          school_id: finalSchoolId,
          email,
          invited_by: user.id,
          permissions,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        type: 'invitation',
        invitation_id: invitation.invitation_id,
        message: `Invitation sent to ${email}. They need to sign up and accept the invitation.`
      });
    }

    // User exists - make them an admin directly
    const { data: adminRecord, error: adminError } = await supabase
      .from('school_admins')
      .insert({
        user_id: userId,
        school_id: finalSchoolId,
        is_primary,
        permissions
      })
      .select()
      .single();

    if (adminError) {
      // Check if already admin
      if (adminError.code === '23505') {
        return NextResponse.json({ 
          error: 'User is already an admin for this school' 
        }, { status: 400 });
      }
      console.error('Error creating admin:', adminError);
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }

    // Update teacher profile if exists
    await supabase
      .from('teacher_profiles')
      .update({ 
        school_id: finalSchoolId,
        is_school_member: true 
      })
      .eq('user_id', userId);

    return NextResponse.json({ 
      success: true,
      type: 'direct',
      admin_id: adminRecord.admin_id,
      message: `Successfully made ${email} an admin for the school`
    });
  } catch (error) {
    console.error('Error in POST /api/super-admin/create-admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}