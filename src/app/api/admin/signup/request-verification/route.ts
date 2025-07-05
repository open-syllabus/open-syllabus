import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/signup/request-verification - Submit manual verification request
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: any = await request.json();
    const { 
      school_id,
      full_name,
      role_title,
      phone_number,
      verification_documents 
    } = body;

    // Validate required fields
    if (!full_name || !role_title) {
      return NextResponse.json({ 
        error: 'Missing required fields: full_name, role_title' 
      }, { status: 400 });
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from('admin_verification_requests')
      .select('request_id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have a pending verification request' 
      }, { status: 400 });
    }

    // Create verification request
    const { data: verificationRequest, error } = await supabase
      .from('admin_verification_requests')
      .insert({
        user_id: user.id,
        school_id,
        email: user.email,
        full_name,
        role_title,
        phone_number,
        verification_documents: verification_documents || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating verification request:', error);
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    // TODO: Send notification to Skolr admin team

    return NextResponse.json({ 
      success: true,
      request_id: verificationRequest.request_id,
      message: 'Verification request submitted. We will review and respond within 2-3 business days.'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/signup/request-verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}