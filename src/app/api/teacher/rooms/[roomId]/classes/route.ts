// src/app/api/teacher/rooms/[roomId]/classes/route.ts
// API endpoint for managing classes linked to a room

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{
    roomId: string;
  }>;
}

// GET: List all classes linked to a room
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { roomId } = await params;
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Verify room ownership
    const { data: room } = await supabase
      .from('rooms')
      .select('room_id, room_name')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get classes linked to this room
    const { data: roomClasses, error } = await supabase
      .from('room_classes')
      .select(`
        class_id,
        added_at,
        class:teacher_classes!class_id (
          class_id,
          name,
          description,
          grade_level,
          subject,
          student_count
        )
      `)
      .eq('room_id', roomId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('[API Room Classes GET] Error fetching room classes:', error);
      return NextResponse.json({ error: 'Failed to fetch room classes' }, { status: 500 });
    }

    // Transform the data
    const classes = roomClasses?.map(rc => ({
      ...rc.class,
      linked_at: rc.added_at
    })) || [];

    return NextResponse.json({ 
      room,
      classes 
    });
  } catch (error) {
    console.error('[API Room Classes GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Link classes to a room
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { roomId } = await params;
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Verify room ownership
    const { data: room } = await supabase
      .from('rooms')
      .select('room_id, room_name')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    let { class_ids, class_id } = body;

    // Support both single class_id and array of class_ids
    if (class_id && !class_ids) {
      class_ids = [class_id];
    }

    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return NextResponse.json({ error: 'Class ID(s) required' }, { status: 400 });
    }

    // Verify all classes belong to the teacher
    const { data: teacherClasses } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', user.id)
      .in('class_id', class_ids);

    if (!teacherClasses || teacherClasses.length !== class_ids.length) {
      return NextResponse.json({ 
        error: 'Some class IDs are invalid or do not belong to you' 
      }, { status: 400 });
    }

    // Check which classes are already linked
    const { data: existingLinks } = await supabase
      .from('room_classes')
      .select('class_id')
      .eq('room_id', roomId)
      .in('class_id', class_ids);

    const existingClassIds = new Set(
      existingLinks?.map(link => link.class_id) || []
    );

    // Filter out already linked classes
    const newClassIds = class_ids.filter(id => !existingClassIds.has(id));

    if (newClassIds.length === 0) {
      return NextResponse.json({ 
        message: 'All classes are already linked to this room',
        added: 0,
        skipped: class_ids.length
      });
    }

    // Link new classes to the room
    const roomClassRecords = newClassIds.map(class_id => ({
      room_id: roomId,
      class_id,
      added_by: user.id
    }));

    const { error: insertError } = await supabase
      .from('room_classes')
      .insert(roomClassRecords);

    if (insertError) {
      console.error('[API Room Classes POST] Error linking classes:', insertError);
      return NextResponse.json({ error: 'Failed to link classes to room' }, { status: 500 });
    }

    // Add students from these classes to the room using the helper function
    for (const classId of newClassIds) {
      try {
        // Use admin client to call the helper function
        const { error: functionError } = await adminClient.rpc(
          'add_class_students_to_room', 
          { 
            p_room_id: roomId, 
            p_class_id: classId 
          }
        );

        if (functionError) {
          console.warn(`[API Room Classes POST] Error adding students from class ${classId}:`, functionError);
        } else {
          console.log(`[API Room Classes POST] Added students from class ${classId} to room ${roomId}`);
        }
      } catch (error) {
        console.error(`[API Room Classes POST] Exception adding students from class ${classId}:`, error);
      }
    }

    console.log(`[API Room Classes POST] Linked ${newClassIds.length} classes to room ${roomId}`);
    
    return NextResponse.json({
      message: 'Classes linked successfully',
      added: newClassIds.length,
      skipped: existingClassIds.size,
      room_id: roomId
    }, { status: 201 });
  } catch (error) {
    console.error('[API Room Classes POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Unlink classes from a room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { roomId } = await params;
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Verify room ownership
    const { data: room } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { class_ids } = body;

    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return NextResponse.json({ error: 'Class IDs array is required' }, { status: 400 });
    }

    // Remove students from these classes from the room (if not in other linked classes)
    for (const classId of class_ids) {
      try {
        // Use admin client to call the helper function
        const { error: functionError } = await adminClient.rpc(
          'remove_class_students_from_room', 
          { 
            p_room_id: roomId, 
            p_class_id: classId 
          }
        );

        if (functionError) {
          console.warn(`[API Room Classes DELETE] Error removing students from class ${classId}:`, functionError);
        } else {
          console.log(`[API Room Classes DELETE] Removed students from class ${classId} from room ${roomId}`);
        }
      } catch (error) {
        console.error(`[API Room Classes DELETE] Exception removing students from class ${classId}:`, error);
      }
    }

    // Unlink classes from the room
    const { error: deleteError } = await supabase
      .from('room_classes')
      .delete()
      .eq('room_id', roomId)
      .in('class_id', class_ids);

    if (deleteError) {
      console.error('[API Room Classes DELETE] Error unlinking classes:', deleteError);
      return NextResponse.json({ error: 'Failed to unlink classes from room' }, { status: 500 });
    }

    console.log(`[API Room Classes DELETE] Unlinked classes from room ${roomId}`);
    
    return NextResponse.json({
      message: 'Classes unlinked successfully',
      room_id: roomId
    });
  } catch (error) {
    console.error('[API Room Classes DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}