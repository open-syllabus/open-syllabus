// src/app/api/teacher/dashboard-all/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Simple in-memory cache
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds cache for dashboard data

export async function GET() {
  console.log('\n--- [API GET /dashboard-all] ---');
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API DASHBOARD-ALL] Not authenticated.', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `dashboard-all-${user.id}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[API DASHBOARD-ALL] Returning cached data');
      return NextResponse.json(cached.data);
    }

    const supabaseAdmin = createAdminClient();

    // First check if teacher profile exists
    const { data: teacherProfile, error: profileCheckError } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileCheckError || !teacherProfile) {
      console.warn('[API DASHBOARD-ALL] Teacher profile not found for user:', user.id);
      return NextResponse.json({ 
        error: 'Teacher profile not found',
        profile: null,
        rooms: [],
        stats: {
          totalStudents: 0,
          totalChatbots: 0,
          totalRooms: 0,
          activeRooms: 0,
          assessmentsCompleted: 0,
          pendingConcerns: 0,
          roomEngagement: []
        },
        recentActivity: { joins: [], assessments: [], concerns: [] }
      });
    }

    // Fetch all data in parallel
    const [
      profileResult,
      roomsResult,
      statsResult,
      recentActivityResult
    ] = await Promise.all([
      // Teacher profile
      supabaseAdmin
        .from('teacher_profiles')
        .select('user_id, full_name, email')
        .eq('user_id', user.id)
        .single(),

      // Teacher's rooms with student count
      supabaseAdmin
        .from('rooms')
        .select(`
          room_id, 
          room_name,
          room_members!left (
            student_id
          )
        `)
        .eq('teacher_id', user.id)
        .eq('is_archived', false),

      // Dashboard stats - fetch directly instead of making HTTP request
      (async () => {
        // Get teacher's room IDs first
        const { data: teacherRooms } = await supabaseAdmin
          .from('rooms')
          .select('room_id')
          .eq('teacher_id', user.id);
        
        const roomIds = teacherRooms?.map(room => room.room_id) || [];
        
        // Fetch all stats concurrently using admin client
        const [
          chatbotsResult,
          roomsResult,
          activeRoomsResult,
          pendingConcernsResult,
          studentsResult,
          assessmentsResult
        ] = await Promise.all([
          supabaseAdmin
            .from('chatbots')
            .select('chatbot_id', { count: 'exact', head: true })
            .eq('teacher_id', user.id),
          supabaseAdmin
            .from('rooms')
            .select('room_id', { count: 'exact', head: true })
            .eq('teacher_id', user.id),
          supabaseAdmin
            .from('rooms')
            .select('room_id', { count: 'exact', head: true })
            .eq('teacher_id', user.id)
            .eq('is_active', true),
          supabaseAdmin
            .from('flagged_messages')
            .select('flag_id', { count: 'exact', head: true })
            .eq('teacher_id', user.id)
            .eq('status', 'pending'),
          // Count unique students across all teacher's rooms
          roomIds.length > 0 
            ? supabaseAdmin
                .from('room_members')
                .select('student_id', { count: 'exact', head: true })
                .in('room_id', roomIds)
            : Promise.resolve({ count: 0, error: null }),
          // Count completed assessments in teacher's rooms
          roomIds.length > 0
            ? supabaseAdmin
                .from('student_assessments')
                .select('assessment_id', { count: 'exact', head: true })
                .in('room_id', roomIds)
                .eq('status', 'completed')
            : Promise.resolve({ count: 0, error: null })
        ]);

        // Fetch room engagement stats (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let roomEngagementStats: any[] = [];
        if (roomIds.length > 0) {
          // Get room details
          const { data: rooms } = await supabaseAdmin
            .from('rooms')
            .select('room_id, room_name')
            .eq('teacher_id', user.id)
            .eq('is_archived', false)
            .eq('is_active', true)
            .limit(10);
          
          if (rooms && rooms.length > 0) {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            // Batch fetch all room data in parallel
            const roomStatsPromises = rooms.map(async (room) => {
              const [studentsResult, messagesResult, recentChatsResult] = await Promise.all([
                // Total students
                supabaseAdmin
                  .from('room_members')
                  .select('*', { count: 'exact', head: true })
                  .eq('room_id', room.room_id)
                  .eq('is_active', true),
                // Active students
                supabaseAdmin
                  .from('chat_messages')
                  .select('user_id')
                  .eq('room_id', room.room_id)
                  .gte('created_at', sevenDaysAgo.toISOString())
                  .in('role', ['user']),
                // Recent chats
                supabaseAdmin
                  .from('chat_messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('room_id', room.room_id)
                  .gte('created_at', oneDayAgo.toISOString())
              ]);
              
              const totalStudents = studentsResult.count || 0;
              const uniqueActiveStudents = new Set(messagesResult.data?.map(msg => msg.user_id) || []);
              const activeStudents = uniqueActiveStudents.size;
              
              if (totalStudents > 0) {
                return {
                  room_id: room.room_id,
                  room_name: room.room_name,
                  totalStudents,
                  activeStudents,
                  engagementRate: Math.round((activeStudents / totalStudents) * 100),
                  recentChats: recentChatsResult.count || 0
                };
              }
              return null;
            });
            
            const allRoomStats = await Promise.all(roomStatsPromises);
            roomEngagementStats = allRoomStats
              .filter(stat => stat !== null)
              .sort((a, b) => b!.engagementRate - a!.engagementRate)
              .slice(0, 5);
          }
        }

        return {
          totalChatbots: chatbotsResult.count || 0,
          totalRooms: roomsResult.count || 0,
          activeRooms: activeRoomsResult.count || 0,
          pendingConcerns: pendingConcernsResult.count || 0,
          totalStudents: studentsResult.count || 0,
          assessmentsCompleted: assessmentsResult.count || 0,
          roomEngagement: roomEngagementStats
        };
      })(),

      // Recent activity data
      (async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get teacher's room IDs first
        const { data: teacherRooms } = await supabaseAdmin
          .from('rooms')
          .select('room_id')
          .eq('teacher_id', user.id);

        const roomIds = teacherRooms?.map(r => r.room_id) || [];
        
        if (roomIds.length === 0) {
          return { joins: [], assessments: [], concerns: [] };
        }

        // Fetch recent activity data in parallel
        const [joinsResult, assessmentsResult, concernsResult] = await Promise.all([
          // Recent joins
          supabaseAdmin
            .from('room_members')
            .select(`
              student_id,
              room_id,
              joined_at,
              students!inner(first_name, surname, username)
            `)
            .in('room_id', roomIds)
            .gte('joined_at', sevenDaysAgo.toISOString())
            .order('joined_at', { ascending: false })
            .limit(10),

          // Recent assessments
          supabaseAdmin
            .from('student_assessments')
            .select(`
              assessment_id,
              room_id,
              assessed_at,
              status,
              student_id,
              chatbot_id,
              students!inner(first_name, surname, username),
              chatbots!inner(name)
            `)
            .in('room_id', roomIds)
            .gte('assessed_at', sevenDaysAgo.toISOString())
            .order('assessed_at', { ascending: false })
            .limit(10),

          // Recent concerns
          supabaseAdmin
            .from('flagged_messages')
            .select(`
              flag_id,
              created_at,
              room_id,
              student_id
            `)
            .eq('teacher_id', user.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        return {
          joins: joinsResult.data || [],
          assessments: assessmentsResult.data || [],
          concerns: concernsResult.data || []
        };
      })()
    ]);

    // Log any errors from the individual results
    if (profileResult.error) {
      console.error('[API DASHBOARD-ALL] Profile fetch error:', profileResult.error);
    }
    if (roomsResult.error) {
      console.error('[API DASHBOARD-ALL] Rooms fetch error:', roomsResult.error);
    }

    // Process rooms to include student count
    const processedRooms = (roomsResult.data || []).map((room: any) => ({
      room_id: room.room_id,
      room_name: room.room_name,
      student_count: room.room_members?.length || 0
    }));

    const dashboardData = {
      profile: profileResult.data,
      rooms: processedRooms,
      stats: statsResult,
      recentActivity: recentActivityResult
    };

    // Cache the results
    dashboardCache.set(cacheKey, { data: dashboardData, timestamp: Date.now() });

    console.log('[API DASHBOARD-ALL] Returning combined dashboard data:', {
      hasProfile: !!profileResult.data,
      roomsCount: dashboardData.rooms.length,
      statsAvailable: !!statsResult,
      recentActivityCount: {
        joins: recentActivityResult.joins.length,
        assessments: recentActivityResult.assessments.length,
        concerns: recentActivityResult.concerns.length
      }
    });
    return NextResponse.json(dashboardData);

  } catch (error: unknown) {
    const typedError = error as Error;
    console.error('[API DASHBOARD-ALL] Error:', typedError.message);
    return NextResponse.json({ error: typedError.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}