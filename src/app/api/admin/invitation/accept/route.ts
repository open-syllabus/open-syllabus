import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/invitation/accept - Accept an admin invitation
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    // Accept the invitation
    const { data: result, error } = await supabase.rpc('accept_admin_invitation', {
      p_token: token,
      p_user_id: user.id
    });

    if (error) {
      console.error('Error accepting invitation:', error);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/admin/invitation/accept:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/invitation/verify - Verify an invitation token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check invitation details
    const { data: invitation, error } = await supabase
      .from('admin_invitations')
      .select(`
        invitation_id,
        email,
        expires_at,
        used_at,
        school:schools(school_id, name)
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.used_at) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      school: invitation.school
    });
  } catch (error) {
    console.error('Error in GET /api/admin/invitation/verify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}