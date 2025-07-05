import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/super-admin/domains - Get all school domains
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

    // Get all domains
    const { data: domains, error } = await supabase
      .from('school_domains')
      .select('*')
      .order('domain', { ascending: true });

    if (error) {
      console.error('Error fetching domains:', error);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error in GET /api/super-admin/domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/super-admin/domains - Add a new verified domain
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
    const { domain, school_name, country_code } = body;

    if (!domain || !school_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: domain, school_name' 
      }, { status: 400 });
    }

    // Add the domain
    const { data: result, error } = await supabase.rpc('add_verified_domain', {
      p_domain: domain,
      p_school_name: school_name,
      p_country_code: country_code
    });

    if (error) {
      console.error('Error adding domain:', error);
      return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/super-admin/domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/super-admin/domains - Remove a domain
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    // Delete the domain
    const { error } = await supabase
      .from('school_domains')
      .delete()
      .eq('domain_id', domainId);

    if (error) {
      console.error('Error deleting domain:', error);
      return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/super-admin/domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}