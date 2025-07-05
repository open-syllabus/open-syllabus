import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.email !== 'darren@coxon.ai') {
      return NextResponse.json({ 
        error: 'Unauthorized - must be darren@coxon.ai'
      }, { status: 401 });
    }

    // Use admin client to run the function
    const supabaseAdmin = createAdminClient();
    
    // Run the make_darren_super_admin function
    const { data: result, error } = await supabaseAdmin
      .rpc('make_darren_super_admin');

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to create super admin',
        details: error.message
      }, { status: 500 });
    }

    // Also manually insert if the function didn't work
    if (!result?.success) {
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('super_admins')
        .insert({
          user_id: user.id,
          email: 'darren@coxon.ai',
          full_name: 'Darren Coxon',
          permissions: {
            manage_schools: true,
            manage_admins: true,
            manage_domains: true,
            view_all_data: true,
            manage_subscriptions: true,
            approve_verifications: true
          },
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (insertError && insertError.code !== '23505') { // Ignore duplicate error
        return NextResponse.json({ 
          error: 'Failed to insert super admin',
          details: insertError.message
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: 'Super admin created manually',
        data: insertData
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}