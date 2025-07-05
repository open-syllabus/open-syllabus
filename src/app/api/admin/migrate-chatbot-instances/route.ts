// Admin endpoint to create missing student_chatbot_instances for existing room memberships
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Check for admin key
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_MIGRATION_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // Get all room memberships
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select(`
        room_id,
        student_id,
        rooms (
          room_id,
          is_active
        )
      `)
      .eq('is_active', true);

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ message: 'No active memberships found' });
    }

    // Filter active rooms
    const activeMemberships = memberships.filter(m => {
      const room = m.rooms as any;
      return room?.is_active === true;
    });

    console.log(`Found ${activeMemberships.length} active memberships to process`);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each membership
    for (const membership of activeMemberships) {
      // Get all chatbots in this room
      const { data: roomChatbots, error: chatbotsError } = await supabaseAdmin
        .from('room_chatbots')
        .select(`
          chatbot_id,
          chatbots (
            chatbot_id,
            is_archived
          )
        `)
        .eq('room_id', membership.room_id);

      if (chatbotsError) {
        console.error(`Error fetching chatbots for room ${membership.room_id}:`, chatbotsError);
        totalErrors++;
        continue;
      }

      if (!roomChatbots || roomChatbots.length === 0) {
        totalSkipped++;
        continue;
      }

      // Filter active chatbots
      const activeChatbots = roomChatbots.filter(rc => {
        const chatbot = rc.chatbots as any;
        return chatbot && !chatbot.is_archived;
      });

      if (activeChatbots.length === 0) {
        totalSkipped++;
        continue;
      }

      // Check existing instances for this student in this room
      const { data: existingInstances } = await supabaseAdmin
        .from('student_chatbot_instances')
        .select('chatbot_id')
        .eq('student_id', membership.student_id)
        .eq('room_id', membership.room_id);

      const existingChatbotIds = new Set(existingInstances?.map(i => i.chatbot_id) || []);

      // Create missing instances
      const instancesToCreate = activeChatbots
        .filter(rc => !existingChatbotIds.has(rc.chatbot_id))
        .map(rc => ({
          student_id: membership.student_id,
          chatbot_id: rc.chatbot_id,
          room_id: membership.room_id,
          is_active: true
        }));

      if (instancesToCreate.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('student_chatbot_instances')
          .insert(instancesToCreate);

        if (insertError) {
          console.error(`Error creating instances for student ${membership.student_id}:`, insertError);
          totalErrors++;
        } else {
          totalCreated += instancesToCreate.length;
          console.log(`Created ${instancesToCreate.length} instances for student ${membership.student_id} in room ${membership.room_id}`);
        }
      } else {
        totalSkipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        totalMemberships: activeMemberships.length,
        instancesCreated: totalCreated,
        membershipsSkipped: totalSkipped,
        errors: totalErrors
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}