import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/signup/verify-domain - Check if email domain is whitelisted
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify the domain
    const { data: result, error } = await supabase.rpc('verify_school_domain', {
      p_email: email
    });

    if (error) {
      console.error('Error verifying domain:', error);
      return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/admin/signup/verify-domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}