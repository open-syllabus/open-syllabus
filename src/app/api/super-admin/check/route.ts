import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        user: null,
        isSuperAdmin: false 
      }, { status: 401 });
    }

    // Check if user is super admin
    const { data: isSuper, error: checkError } = await supabase
      .rpc('is_super_admin', { p_user_id: user.id });

    // Also get super admin details
    const { data: superAdminData } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email
      },
      isSuperAdmin: isSuper || false,
      superAdminData,
      checkError
    });
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}