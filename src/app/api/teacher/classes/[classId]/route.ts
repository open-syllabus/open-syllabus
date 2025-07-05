// src/app/api/teacher/classes/[classId]/route.ts
// API endpoint for managing individual classes

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{
    classId: string;
  }>;
}

// GET: Get a specific class with students
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Get the class and verify ownership
    const { data: classData, error: classError } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (classError || !classData) {
      console.error('[API Teacher Classes GET] Error fetching class:', classError);
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get students separately
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select('student_id, added_at')
      .eq('class_id', classId);

    if (studentsError) {
      console.error('[API Teacher Classes GET] Error fetching class students:', studentsError);
    }

    // Get student profiles using admin client
    const adminClient = createAdminClient();
    const students = [];
    
    if (classStudents && classStudents.length > 0) {
      const studentIds = classStudents.map(cs => cs.student_id);
      
      console.log('[API Teacher Classes GET] Fetching profiles for student IDs:', studentIds);
      
      // Fetch from the new students table
      const { data: studentProfiles, error: profilesError } = await adminClient
        .from('students')
        .select('student_id, first_name, surname, username, auth_user_id')
        .in('student_id', studentIds);

      if (profilesError) {
        console.error('[API Teacher Classes GET] Error fetching student profiles:', profilesError);
      }
      
      console.log('[API Teacher Classes GET] Found student profiles:', studentProfiles?.length || 0);
      console.log('[API Teacher Classes GET] Sample profile:', studentProfiles?.[0]);

      // Get emails from auth.users if needed
      let authEmails: Record<string, string> = {};
      if (studentProfiles && studentProfiles.length > 0) {
        const authUserIds = studentProfiles
          .map(p => p.auth_user_id)
          .filter(id => id != null);
        
        if (authUserIds.length > 0) {
          const { data: authUsers } = await adminClient
            .from('auth.users')
            .select('id, email')
            .in('id', authUserIds);
          
          if (authUsers) {
            authEmails = authUsers.reduce((acc, user) => {
              acc[user.id] = user.email;
              return acc;
            }, {} as Record<string, string>);
          }
        }
      }

      // Combine the data with robust name handling
      for (const cs of classStudents) {
        const profile = studentProfiles?.find(p => p.student_id === cs.student_id);
        
        if (!profile) {
          console.warn(`[API Teacher Classes GET] No profile found for student ${cs.student_id}`);
        }
        
        // Determine the display name with multiple fallbacks
        let displayName = 'Unknown Student';
        
        if (profile) {
          // Construct from first_name and surname
          if (profile.first_name || profile.surname) {
            const firstName = profile.first_name?.trim() || '';
            const surname = profile.surname?.trim() || '';
            displayName = `${firstName} ${surname}`.trim() || 'Unknown Student';
          }
          // Fall back to username if available
          else if (profile.username) {
            displayName = `Student: ${profile.username}`;
          }
        }
        
        // Get email from auth.users
        const email = profile?.auth_user_id ? authEmails[profile.auth_user_id] : null;
        
        students.push({
          student_id: cs.student_id,
          full_name: displayName,
          email: email || null,
          username: profile?.username || null,
          added_at: cs.added_at
        });
      }
    }

    const classWithStudents = {
      ...classData,
      students
    };

    return NextResponse.json({ class: classWithStudents });
  } catch (error) {
    console.error('[API Teacher Classes GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update class details
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingClass } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    // Only update provided fields
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.academic_year !== undefined) updates.academic_year = body.academic_year?.trim() || null;
    if (body.grade_level !== undefined) updates.grade_level = body.grade_level?.trim() || null;
    if (body.subject !== undefined) updates.subject = body.subject?.trim() || null;
    if (body.is_archived !== undefined) updates.is_archived = body.is_archived;

    // Validate name if provided
    if (updates.name !== undefined && (!updates.name || updates.name === '')) {
      return NextResponse.json({ error: 'Class name cannot be empty' }, { status: 400 });
    }

    // Update the class
    const { data: updatedClass, error: updateError } = await supabase
      .from('teacher_classes')
      .update(updates)
      .eq('class_id', classId)
      .select()
      .single();

    if (updateError) {
      console.error('[API Teacher Classes PATCH] Error updating class:', updateError);
      
      // Check for unique constraint violation
      if (updateError.code === '23505') {
        return NextResponse.json({ 
          error: 'A class with this name already exists' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }

    console.log(`[API Teacher Classes PATCH] Updated class ${classId}`);
    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error('[API Teacher Classes PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a class
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingClass } = await supabase
      .from('teacher_classes')
      .select('class_id, name')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if class is linked to any rooms
    const { data: roomLinks } = await supabase
      .from('room_classes')
      .select('room_id')
      .eq('class_id', classId)
      .limit(1);

    if (roomLinks && roomLinks.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete class that is linked to rooms. Please unlink from all rooms first.' 
      }, { status: 409 });
    }

    // Use admin client to ensure cascade deletes work properly
    const { error: deleteError } = await adminClient
      .from('teacher_classes')
      .delete()
      .eq('class_id', classId);

    if (deleteError) {
      console.error('[API Teacher Classes DELETE] Error deleting class:', deleteError);
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
    }

    console.log(`[API Teacher Classes DELETE] Deleted class ${classId} (${existingClass.name})`);
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('[API Teacher Classes DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}