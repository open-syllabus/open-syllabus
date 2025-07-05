// src/app/api/student/verify-membership/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateRoomAccess } from '@/lib/utils/room-validation';
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from '@/lib/utils/api-responses';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    console.log('[Verify Membership API] Request received:', { roomId, userId });

    // Validate required parameters
    if (!roomId || !userId) {
      return createErrorResponse(
        'Missing required parameters: roomId and userId are required', 
        400, 
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Use admin client to check membership reliably
    const supabaseAdmin = createAdminClient();

    // First, get the actual student record to get the student_id
    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();
      
    console.log('[Verify Membership API] Student lookup result:', {
      found: !!studentProfile,
      error: studentError?.message,
      studentProfile
    });
      
    if (studentError || !studentProfile) {
      console.error('[API GET /verify-membership] Student profile not found:', userId, studentError);
      return createErrorResponse('Student profile not found', 404, ErrorCodes.STUDENT_NOT_FOUND);
    }
    
    const actualStudentId = studentProfile.student_id;
    console.log('[API GET /verify-membership] Found student_id:', actualStudentId, 'for auth_user_id:', userId);

    // Verify room exists and is active
    const roomValidation = await validateRoomAccess(roomId);
    if (roomValidation.error) {
      return handleApiError(roomValidation.error);
    }

    // Check if user is a member of the room using actual student_id
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select('room_id, is_active')
      .eq('room_id', roomId)
      .eq('student_id', actualStudentId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('[Verify Membership API] Membership check result:', {
      found: !!membership,
      error: membershipError?.message,
      membership,
      query: {
        room_id: roomId,
        student_id: actualStudentId,
        is_active: true
      }
    });

    if (membershipError) {
      console.error('[API GET /verify-membership] Error checking membership:', membershipError);
      return createErrorResponse('Error checking membership', 500, ErrorCodes.DATABASE_ERROR);
    }

    const isMember = !!membership;

    // If not a member, return false - teachers must add students
    if (!isMember) {
      console.log('[API GET /verify-membership] User not a member of room');
      return createSuccessResponse({ 
        isMember: false, 
        message: 'User is not a member of this room. Please ask your teacher to add you.' 
      });
    }

    // Already a member
    return createSuccessResponse({ 
      isMember: true, 
      message: 'User is already a member of this room' 
    });
  } catch (error) {
    console.error('[API GET /verify-membership] Unexpected error:', error);
    return handleApiError(error);
  }
}