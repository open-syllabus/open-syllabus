// src/app/api/teacher/rooms/[roomId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const params = await context.params;
    const roomId = params.roomId;

    // Build update object with only provided fields
    const updateData: any = {};
    if ('is_active' in body) updateData.is_active = body.is_active;

    // Update room
    const { data: room, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('room_id', roomId)
      .eq('teacher_id', user.id) // Ensure only the room owner can update
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    // Apply rate limiting for room deletion
    const rateLimitResult = await checkRateLimit(request, {
      limit: 10,
      windowMs: 60 * 60 * 1000, // 10 deletions per hour
      message: 'Too many room deletion requests. Please try again later.'
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const params = await context.params;
    const roomId = params.roomId;

    // First, check if the user owns this room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Delete the room (this should cascade to related tables via foreign key constraints)
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .eq('room_id', roomId)
      .eq('teacher_id', user.id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete room';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}