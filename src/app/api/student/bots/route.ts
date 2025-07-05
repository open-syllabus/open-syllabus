// src/app/api/student/bots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to ensure we can access all data
    const supabaseAdmin = createAdminClient();
    
    // First, get the student record to find the correct student_id
    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (studentError || !studentRecord) {
      console.error('[API GET /student/skolrs] Student not found:', studentError);
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentId = studentRecord.id;
    
    // Get all rooms the student is a member of
    const { data: roomMemberships, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select(`
        room_id,
        rooms (
          room_id,
          room_name,
          room_code,
          is_active
        )
      `)
      .eq('student_id', studentId);

    if (membershipError) {
      console.error('[API GET /student/skolrs] Error fetching room memberships:', membershipError);
      return NextResponse.json({ error: 'Error fetching room data' }, { status: 500 });
    }

    if (!roomMemberships || roomMemberships.length === 0) {
      return NextResponse.json({ 
        skolrs: [],
        totalRooms: 0,
        stats: {
          total: 0,
          learning: 0,
          assessment: 0,
          readingRoom: 0,
          viewingRoom: 0,
          knowledgeBook: 0
        }
      });
    }

    // Filter out inactive rooms
    const activeRoomIds = roomMemberships
      .filter(rm => {
        const roomData = rm.rooms as any;
        return roomData?.is_active === true;
      })
      .map(rm => rm.room_id);

    if (activeRoomIds.length === 0) {
      return NextResponse.json({ 
        skolrs: [],
        totalRooms: 0,
        stats: {
          total: 0,
          learning: 0,
          assessment: 0,
          readingRoom: 0,
          viewingRoom: 0,
          knowledgeBook: 0
        }
      });
    }

    // Get all student bot access records across all active rooms
    const { data: botAccess, error: accessError } = await supabaseAdmin
      .from('student_bot_access')
      .select(`
        id,
        bot_id,
        room_id,
        created_at,
        bots (
          id,
          name,
          description,
          model,
          type,
          welcome_message,
          has_documents,
          is_archived
        )
      `)
      .eq('student_id', studentId)
      .in('room_id', activeRoomIds)
      .order('created_at', { ascending: false });

    if (accessError) {
      console.error('[API GET /student/bots] Error fetching bot access:', accessError);
      return NextResponse.json({ error: 'Error fetching bot data' }, { status: 500 });
    }

    // Filter out archived bots
    const activeBots = (botAccess || []).filter(access => {
      const bot = access.bots as any;
      return bot && !bot.is_archived;
    });

    // Get interaction counts for each bot access
    const accessIds = activeBots.map(access => access.id);
    
    const { data: sessionCounts } = await supabaseAdmin
      .from('chat_sessions')
      .select('student_bot_access_id, message_count')
      .in('student_bot_access_id', accessIds);

    // Count interactions per instance
    const interactionMap = new Map<string, number>();
    (sessionCounts || []).forEach((session: { student_bot_access_id: string; message_count: number }) => {
      const currentCount = interactionMap.get(session.student_bot_access_id) || 0;
      interactionMap.set(session.student_bot_access_id, currentCount + (session.message_count || 0));
    });

    // Format the response with room information
    const roomMap = new Map(roomMemberships.map(rm => [rm.room_id, rm.rooms as any]));
    
    const formattedBots = activeBots.map(access => {
      const bot = access.bots as any;
      const room = roomMap.get(access.room_id);
      
      return {
        access_id: access.id,
        bot_id: access.bot_id,
        room_id: access.room_id,
        room_name: room?.name || 'Unknown Room',
        room_code: room?.code || '',
        name: bot?.name || 'Unknown Bot',
        description: bot?.description || '',
        model: bot?.model,
        bot_type: bot?.type || 'learning',
        welcome_message: bot?.welcome_message,
        has_documents: bot?.has_documents || false,
        interaction_count: interactionMap.get(access.id) || 0,
        created_at: access.created_at
      };
    });

    // Calculate stats
    const stats = {
      total: formattedBots.length,
      learning: formattedBots.filter(b => b.bot_type === 'learning').length,
      assessment: formattedBots.filter(b => b.bot_type === 'assessment').length,
      readingRoom: formattedBots.filter(b => b.bot_type === 'reading_room').length,
      viewingRoom: formattedBots.filter(b => b.bot_type === 'viewing_room').length,
      knowledgeBook: formattedBots.filter(b => b.bot_type === 'knowledge_book').length
    };

    // Apply search and filters if provided
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm');
    const botType = searchParams.get('botType');
    const sortBy = searchParams.get('sortBy') || 'created_at_desc';

    let filteredBots = formattedBots;

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredBots = filteredBots.filter(bot => 
        bot.name.toLowerCase().includes(lowerSearch) ||
        bot.description.toLowerCase().includes(lowerSearch) ||
        bot.room_name.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply bot type filter
    if (botType) {
      filteredBots = filteredBots.filter(bot => bot.bot_type === botType);
    }

    // Apply sorting
    filteredBots.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_at_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'interactions_desc':
          return b.interaction_count - a.interaction_count;
        case 'room_name_asc':
          return a.room_name.localeCompare(b.room_name);
      }
    });

    return NextResponse.json({ 
      bots: filteredBots,
      totalRooms: activeRoomIds.length,
      stats
    });

  } catch (error) {
    console.error('[API GET /student/bots] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}