import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/super-admin/dashboard - Get super admin dashboard stats
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

    // Get dashboard stats
    const { data: stats, error: statsError } = await supabase
      .from('super_admin_dashboard')
      .select('*')
      .single();

    if (statsError) {
      console.error('Error fetching dashboard stats:', statsError);
    }

    // Get recent schools
    const { data: recentSchools } = await supabase
      .from('schools')
      .select(`
        school_id,
        name,
        subscription_tier,
        created_at,
        _count:teacher_profiles(count)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent admin activities
    const { data: recentAdmins } = await supabase
      .from('school_admins')
      .select(`
        admin_id,
        created_at,
        user:auth.users(email),
        school:schools(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get subscription breakdown
    const { data: subscriptions } = await supabase
      .from('schools')
      .select('subscription_tier')
      .then(result => {
        const breakdown: Record<string, number> = { free: 0, paid: 0, premium: 0 };
        result.data?.forEach(school => {
          const tier = school.subscription_tier || 'free';
          if (tier in breakdown) {
            breakdown[tier]++;
          }
        });
        return { data: breakdown };
      });

    return NextResponse.json({
      stats: stats || {
        total_schools: 0,
        paid_schools: 0,
        total_teachers: 0,
        total_students: 0,
        pending_verifications: 0,
        total_admins: 0
      },
      recent_schools: recentSchools || [],
      recent_admins: recentAdmins || [],
      subscription_breakdown: subscriptions.data
    });
  } catch (error) {
    console.error('Error in GET /api/super-admin/dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}