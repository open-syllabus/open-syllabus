import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/super-admin/verify-request - Get all pending verification requests
export async function GET(request: Request) {
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

    // Get all verification requests
    const { data: requests, error } = await supabase
      .from('admin_verification_requests')
      .select(`
        *,
        user:auth.users(email),
        school:schools(school_id, name)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error in GET /api/super-admin/verify-request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/super-admin/verify-request - Approve or reject a verification request
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
    const { request_id, action, make_primary = false, rejection_reason } = body;

    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Missing required fields: request_id, action (approve/reject)' 
      }, { status: 400 });
    }

    if (action === 'approve') {
      // Approve the request
      const { data: result, error } = await supabase.rpc('approve_admin_verification', {
        p_request_id: request_id,
        p_make_primary: make_primary
      });

      if (error) {
        console.error('Error approving request:', error);
        return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
      }

      return NextResponse.json(result);
    } else {
      // Reject the request
      const { error } = await supabase
        .from('admin_verification_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason
        })
        .eq('request_id', request_id);

      if (error) {
        console.error('Error rejecting request:', error);
        return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error in POST /api/super-admin/verify-request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}