import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log('[Dashboard API] Starting request')
    const supabase = await createServerSupabaseClient()
    const supabaseAdmin = createAdminClient()
    
    // Get authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[Dashboard API] Auth check:', { userId: user?.id, error: authError })
    
    if (authError || !user) {
      console.error('[Dashboard API] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }
    
    const authUserId = user.id;

    // First fetch the user profile to get the student_id
    const userQuery = supabaseAdmin
      .from('students')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
        
    const { data: userProfile, error: userError } = await userQuery;
    
    if (userError || !userProfile) {
      console.error('[Dashboard API] User profile error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Now we have the actual student_id
    const actualStudentId = userProfile.student_id;
    console.log('[Dashboard API] Found student:', { student_id: actualStudentId, username: userProfile.username });
    
    // Fetch all other data in parallel
    const [
      roomsResult,
      assessmentsResult,
      recentChatsResult
    ] = await Promise.all([
      // User's rooms with proper joins
      supabaseAdmin
        .from('room_members')
        .select(`
          room_id,
          joined_at,
          is_active,
          rooms!inner (
            room_id,
            room_name,
            room_code,
            created_at,
            is_active
          )
        `)
        .eq('student_id', actualStudentId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false }),
      
      // Recent assessments
      supabaseAdmin
        .from('student_assessments')
        .select(`
          assessment_id,
          status,
          ai_grade_raw,
          ai_feedback_student,
          assessed_at,
          student_id,
          chatbot_id,
          room_id,
          chatbots!student_assessments_chatbot_id_fkey (
            chatbot_id,
            name
          )
        `)
        .eq('student_id', actualStudentId)
        .order('assessed_at', { ascending: false })
        .limit(5),
      
      // Recent chat messages for activity
      supabaseAdmin
        .from('chat_messages')
        .select(`
          message_id,
          content,
          created_at,
          room_id
        `)
        .eq('user_id', actualStudentId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Check for errors with detailed logging
    if (roomsResult.error) {
      console.error('[Dashboard API] Rooms error:', roomsResult.error)
      throw new Error(`Failed to fetch rooms: ${roomsResult.error.message}`)
    }
    if (assessmentsResult.error) {
      console.error('[Dashboard API] Assessments error:', assessmentsResult.error)
      throw new Error(`Failed to fetch assessments: ${assessmentsResult.error.message}`)
    }
    if (recentChatsResult.error) {
      console.error('[Dashboard API] Recent chats error:', recentChatsResult.error)
      throw new Error(`Failed to fetch recent chats: ${recentChatsResult.error.message}`)
    }
    
    // Debug logging for student profile
    console.log('[Dashboard API] Student profile data:', {
      student_id: actualStudentId,
      first_name: userProfile.first_name,
      surname: userProfile.surname,
      username: userProfile.username,
      pin_code: userProfile.pin_code
    })

    // Get chatbot counts and courses for each room
    const roomIds = roomsResult.data?.map(r => r.room_id) || []
    let chatbotCounts: Record<string, number> = {}
    let roomCourses: Record<string, any[]> = {}
    
    if (roomIds.length > 0) {
      // Fetch chatbot counts
      const { data: chatbotData } = await supabaseAdmin
        .from('room_chatbots')
        .select('room_id, chatbot_id')
        .in('room_id', roomIds)
      
      if (chatbotData) {
        chatbotCounts = chatbotData.reduce((acc, item) => {
          acc[item.room_id] = (acc[item.room_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      // Fetch courses for each room
      const { data: coursesData } = await supabaseAdmin
        .from('room_courses')
        .select(`
          room_id,
          courses (
            course_id,
            title,
            description,
            subject,
            is_published
          )
        `)
        .in('room_id', roomIds)
      
      if (coursesData) {
        roomCourses = coursesData.reduce((acc, item) => {
          const course = item.courses as any;
          // Only include published courses for students
          if (course && course.is_published) {
            if (!acc[item.room_id]) {
              acc[item.room_id] = [];
            }
            acc[item.room_id].push(course);
          }
          return acc
        }, {} as Record<string, any[]>)
      }
    }

    // Format rooms with chatbot counts, courses, and fix structure
    const formattedRooms = roomsResult.data?.map(membership => {
      const room = membership.rooms as any; // rooms is a single object from the join
      return {
        room_id: membership.room_id,
        joined_at: membership.joined_at,
        chatbot_count: chatbotCounts[membership.room_id] || 0,
        course_count: roomCourses[membership.room_id]?.length || 0,
        courses: roomCourses[membership.room_id] || [],
        is_active: room?.is_active ?? true,
        rooms: {
          id: membership.room_id,
          name: room?.room_name || 'Unknown Room',
          room_code: room?.room_code || '',
          created_at: room?.created_at || membership.joined_at,
          is_active: room?.is_active ?? true
        }
      }
    }) || []

    // Get room names for assessments
    const assessmentRoomIds = [...new Set(assessmentsResult.data?.map(a => a.room_id).filter(Boolean) || [])]
    let roomNamesMap: Record<string, string> = {}
    
    if (assessmentRoomIds.length > 0) {
      const { data: roomData } = await supabaseAdmin
        .from('rooms')
        .select('room_id, room_name')
        .in('room_id', assessmentRoomIds)
      
      if (roomData) {
        roomNamesMap = roomData.reduce((acc, room) => {
          acc[room.room_id] = room.room_name
          return acc
        }, {} as Record<string, string>)
      }
    }

    // Format assessments 
    const formattedAssessments = assessmentsResult.data?.map(assessment => {
      // Use the correct property name from the foreign key relationship
      const chatbot = (assessment as any)['chatbots!student_assessments_chatbot_id_fkey'];
      return {
        id: assessment.assessment_id,
        title: chatbot?.name || 'Assessment', // Use chatbot name as title
        status: assessment.status || 'completed',
        score: assessment.ai_grade_raw ? parseFloat(assessment.ai_grade_raw) : null,
        feedback: assessment.ai_feedback_student || null,
        created_at: assessment.assessed_at,
        student_id: assessment.student_id,
        chatbot_id: assessment.chatbot_id,
        room_id: assessment.room_id,
        room_name: roomNamesMap[assessment.room_id] || null,
        chatbots: chatbot ? {
          id: chatbot.chatbot_id,
          name: chatbot.name,
          subject: null // Not available in current query
        } : null
      }
    }) || []

    // Calculate stats
    const totalRooms = formattedRooms.length
    const totalAssessments = formattedAssessments.length
    const recentActivity = recentChatsResult.data?.length || 0

    // Return formatted user data with proper name
    const userData = {
      id: authUserId, // Use auth_user_id, not student_id
      student_id: userProfile.student_id, // Also include student_id separately
      full_name: userProfile.first_name && userProfile.surname ? `${userProfile.first_name} ${userProfile.surname}` : 'Student',
      first_name: userProfile.first_name,
      surname: userProfile.surname,
      username: userProfile.username,
      school_id: userProfile.school_id,
      pin_code: userProfile.pin_code // Add pin_code to the response
    }

    return NextResponse.json({
      user: userData,
      rooms: formattedRooms,
      assessments: formattedAssessments,
      stats: {
        totalRooms,
        totalAssessments,
        averageScore: 0, // Can calculate if needed
        recentActivity
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })

  } catch (error) {
    console.error('[Dashboard API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}