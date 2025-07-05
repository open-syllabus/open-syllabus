// src/app/api/teacher/dashboard-stats/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Simple in-memory cache for dashboard stats
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute cache

export async function GET() {
  console.log('\n--- [API GET /dashboard-stats] ---');
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API STATS] Not authenticated.', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('[API STATS] User authenticated:', user.id);

    const { data: profile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[API STATS] Profile fetch failed or not found:', profileError?.message);
      return NextResponse.json({ error: `Profile fetch issue: ${profileError?.message || 'Not found'}` }, { status: 500 });
    }
    console.log('[API STATS] User is teacher. Proceeding with stats.');
    
    // Check cache first
    const cacheKey = `dashboard-stats-${user.id}`;
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[API STATS] Returning cached stats');
      return NextResponse.json(cached.data);
    }
    
    // Create admin client to bypass RLS policies
    const supabaseAdmin = createAdminClient();
    
    // First, get all room IDs for this teacher
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
            .eq('status', 'pending'), // Count only PENDING concerns
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

    // Error handling for each query (optional, but good for debugging)
    if (chatbotsResult.error) console.error('[API STATS] Error fetching chatbots count:', chatbotsResult.error.message);
    if (roomsResult.error) console.error('[API STATS] Error fetching total rooms count:', roomsResult.error.message);
    if (activeRoomsResult.error) console.error('[API STATS] Error fetching active rooms count:', activeRoomsResult.error.message);
    if (pendingConcernsResult.error) console.error('[API STATS] Error fetching pending concerns count:', pendingConcernsResult.error.message);
    if (studentsResult.error) console.error('[API STATS] Error fetching students count:', studentsResult.error.message);
    if (assessmentsResult.error) console.error('[API STATS] Error fetching assessments count:', assessmentsResult.error.message);

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
        .limit(10); // Limit to prevent too many queries
      
      if (rooms && rooms.length > 0) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        // Batch fetch all room data in parallel
        const roomStatsPromises = rooms.map(async (room) => {
          // Run all queries for this room in parallel
          const [studentsResult, messagesResult, recentChatsResult] = await Promise.all([
            // Total students
            supabaseAdmin
              .from('room_members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.room_id)
              .eq('is_active', true),
            // Active students (simplified query)
            supabaseAdmin
              .from('chat_messages')
              .select('user_id')
              .eq('room_id', room.room_id)
              .gte('created_at', sevenDaysAgo.toISOString())
              .in('role', ['user']), // Simplified condition
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
        
        // Wait for all room stats to complete
        const allRoomStats = await Promise.all(roomStatsPromises);
        
        // Filter out nulls and sort by engagement rate
        roomEngagementStats = allRoomStats
          .filter(stat => stat !== null)
          .sort((a, b) => b!.engagementRate - a!.engagementRate)
          .slice(0, 5);
      }
    }

    const stats = {
      totalChatbots: chatbotsResult.count || 0,
      totalRooms: roomsResult.count || 0,
      activeRooms: activeRoomsResult.count || 0,
      pendingConcerns: pendingConcernsResult.count || 0,
      totalStudents: studentsResult.count || 0,
      assessmentsCompleted: assessmentsResult.count || 0,
      roomEngagement: roomEngagementStats
    };
    
    // Cache the results
    statsCache.set(cacheKey, { data: stats, timestamp: Date.now() });
    
    console.log('[API STATS] Returning stats:', stats);
    return NextResponse.json(stats);

  } catch (error: unknown) {
    const typedError = error as Error;
    console.error('[API STATS] CATCH BLOCK Error:', typedError.message);
    return NextResponse.json({ error: typedError.message || 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}