// src/app/api/teacher/rooms/[roomId]/classes/[classId]/route.ts
// API endpoint for managing individual class-room links

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{
    roomId: string;
    classId: string;
  }>;
}

// DELETE: Unlink a specific class from a room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { roomId, classId } = await params;
    if (!roomId || !classId) {
      return NextResponse.json({ error: 'Room ID and Class ID are required' }, { status: 400 });
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

    // Verify class ownership
    const { data: teacherClass } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Remove students from this class from the room (if not in other linked classes)
    try {
      const { error: functionError } = await adminClient.rpc(
        'remove_class_students_from_room', 
        { 
          p_room_id: roomId, 
          p_class_id: classId 
        }
      );

      if (functionError) {
        console.warn(`[API Room Classes DELETE] Error removing students from class ${classId}:`, functionError);
      }
    } catch (error) {
      console.error(`[API Room Classes DELETE] Exception removing students from class ${classId}:`, error);
    }

    // Unlink the class from the room
    const { error: deleteError } = await supabase
      .from('room_classes')
      .delete()
      .eq('room_id', roomId)
      .eq('class_id', classId);

    if (deleteError) {
      console.error('[API Room Classes DELETE] Error unlinking class:', deleteError);
      return NextResponse.json({ error: 'Failed to unlink class from room' }, { status: 500 });
    }

    console.log(`[API Room Classes DELETE] Unlinked class ${classId} from room ${roomId}`);
    
    return NextResponse.json({
      message: 'Class unlinked successfully',
      room_id: roomId,
      class_id: classId
    });
  } catch (error) {
    console.error('[API Room Classes DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}