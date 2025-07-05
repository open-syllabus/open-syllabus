import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// POST /api/admin/invitation/create - Create a new admin invitation
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, permissions, school_id } = body;

    // Check if user is super admin
    const { data: isSuper, error: superCheckError } = await supabase
      .rpc('is_super_admin', { p_user_id: user.id });

    console.log('Super admin check:', { isSuper, superCheckError, userId: user.id });

    let schoolId = school_id;

    if (isSuper) {
      // Super admin can create invitations for any school
      if (!schoolId) {
        return NextResponse.json({ error: 'School ID is required for super admin' }, { status: 400 });
      }
    } else {
      // Regular admin - check permissions
      const { data: adminData, error: adminError } = await supabase
        .from('school_admins')
        .select('school_id, permissions')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData || !adminData.permissions?.manage_teachers) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      
      schoolId = adminData.school_id;
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists - use admin client to bypass RLS
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createAdminClient();
    
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id, email, full_name')
      .eq('email', email)
      .single();

    console.log('User check:', { 
      email, 
      existingUser, 
      userCheckError,
      isSuper,
      shouldUpgrade: !!(existingUser && isSuper)
    });

    // If user exists and is super admin creating the invitation, 
    // we can directly make them an admin
    if (existingUser && isSuper) {
      // Directly create school admin record using admin client
      const { data: adminRecord, error: adminError } = await supabaseAdmin
        .from('school_admins')
        .insert({
          user_id: existingUser.user_id,
          school_id: schoolId,
          is_primary: false,
          permissions: permissions || {
            manage_students: true,
            manage_teachers: false,
            manage_billing: false,
            view_analytics: true
          }
        })
        .select()
        .single();

      if (adminError && adminError.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating admin:', adminError);
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
      }

      // Update teacher profile using admin client
      await supabaseAdmin
        .from('teacher_profiles')
        .update({ 
          school_id: schoolId,
          is_school_member: true 
        })
        .eq('user_id', existingUser.user_id);

      return NextResponse.json({ 
        success: true,
        message: 'Teacher upgraded to admin successfully',
        upgraded: true,
        user_id: existingUser.user_id
      });
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('admin_invitations')
      .insert({
        school_id: schoolId,
        email,
        invited_by: user.id,
        permissions: permissions || {
          manage_students: true,
          manage_teachers: false,
          manage_billing: false,
          view_analytics: true
        }
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json({ 
        error: 'Failed to create invitation',
        details: inviteError.message,
        code: inviteError.code
      }, { status: 500 });
    }

    // Get school details for email
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('school_id', schoolId)
      .single();

    // Send invitation email
    if (resend) {
      try {
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/accept-invitation?token=${invitation.token}`;
        
        await resend.emails.send({
          from: 'Skolr <noreply@skolr.com>',
          to: email,
          subject: `Admin invitation for ${school?.name || 'your school'}`,
          html: `
            <h2>You've been invited to be an administrator</h2>
            <p>You've been invited to join ${school?.name || 'a school'} as an administrator on Skolr.</p>
            <p>Click the link below to accept this invitation:</p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #985DD7; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the whole operation if email fails
      }
    } else {
      console.log('Resend not configured - skipping email notification');
    }

    return NextResponse.json({ 
      success: true,
      invitation_id: invitation.invitation_id,
      expires_at: invitation.expires_at
    });
  } catch (error) {
    console.error('Error in POST /api/admin/invitation/create:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}