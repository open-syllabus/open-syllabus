import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { user: user?.email, authError });
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'No user found'
      }, { status: 401 });
    }

    // Check if user is super admin
    const { data: isSuper, error: checkError } = await supabase
      .rpc('is_super_admin', { p_user_id: user.id });

    console.log('Super admin check:', { isSuper, checkError });

    if (checkError || !isSuper) {
      return NextResponse.json({ 
        error: 'Super admin access required',
        details: checkError?.message || 'Not a super admin'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, country_code } = body;

    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    // Use service role client for creating schools
    const supabaseAdmin = createAdminClient();

    // Create school
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name,
        country_code: country_code || null,
        subscription_tier: 'free'
      })
      .select()
      .single();

    if (schoolError) {
      console.error('Error creating school:', schoolError);
      return NextResponse.json({ 
        error: 'Failed to create school', 
        details: schoolError.message 
      }, { status: 500 });
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error in POST /api/super-admin/schools/create:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}