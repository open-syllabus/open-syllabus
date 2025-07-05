// src/app/api/student/room-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateRoomAccess } from '@/lib/utils/room-validation';
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from '@/lib/utils/api-responses';
import { cache, CacheTTL, CacheTags } from '@/lib/utils/cache';
import type { Chatbot } from '@/types/database.types';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!roomId || !userId) {
      return createErrorResponse(
        'Missing required parameters: roomId and userId are required', 
        400, 
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // First get the actual student record to get the student_id
    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();
      
    if (studentError || !studentProfile) {
      console.error('[API GET /student/room-data] Student profile not found:', userId, studentError);
      return createErrorResponse('Student profile not found', 404, ErrorCodes.STUDENT_NOT_FOUND);
    }
    
    const actualStudentId = studentProfile.student_id;
    console.log('[API GET /student/room-data] Found student_id:', actualStudentId, 'for auth_user_id:', userId);

    // Verify room exists and is active
    const roomValidation = await validateRoomAccess(roomId);
    if (roomValidation.error) {
      return handleApiError(roomValidation.error);
    }

    // Get full room data for later use
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (roomError || !room) {
      console.error('[API GET /student/room-data] Room not found:', roomId);
      return createErrorResponse('Room not found', 404, ErrorCodes.ROOM_NOT_FOUND);
    }

    // Verify room membership or create it using actual student_id
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('student_id', actualStudentId)
      .maybeSingle();

    if (membershipError) {
      console.error('[API GET /student/room-data] Error checking membership:', membershipError);
    }

    if (!membership) {
      console.log('[API GET /student/room-data] User not in room');
      return createErrorResponse(
        'Student is not a member of this room. Please ask your teacher to add you.',
        403,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Get both chatbots and courses for the room (with caching)
    const cacheKey = `room-data-full:${roomId}:${userId}`;
    const roomData = await cache.get(
      cacheKey,
      async () => {
        const { data: roomChatbots, error: chatbotsRelationError } = await supabaseAdmin
          .from('room_chatbots')
          .select('chatbot_id')
          .eq('room_id', roomId);

        if (chatbotsRelationError) {
          throw new Error(`Error fetching room chatbots: ${chatbotsRelationError.message}`);
        }

        // We need to get student-specific chatbot instances instead of just regular chatbots
        let chatbots: any[] = []; // Use any type to accommodate instance_id
        if (roomChatbots && roomChatbots.length > 0) {
          // First, let's check for student-specific instances
          const chatbotIds = roomChatbots.map(rc => rc.chatbot_id);
          
          // Check if student has instances for these chatbots
          const { data: chatbotInstances, error: instancesError } = await supabaseAdmin
            .from('student_chatbot_instances')
            .select(`
              instance_id,
              chatbot_id,
              chatbots (
                chatbot_id,
                name,
                description,
                model,
                bot_type,
                welcome_message,
                is_archived
              )
            `)
            .eq('room_id', roomId)
            .eq('student_id', actualStudentId)
            .in('chatbot_id', chatbotIds);
            
          if (instancesError) {
            console.error('[API GET /student/room-data] Error fetching student chatbot instances:', instancesError);
          }
          
          // If instances already exist, use them
          if (chatbotInstances && chatbotInstances.length > 0) {
            console.log(`[API GET /student/room-data] Found ${chatbotInstances.length} existing instances for student ${userId}`);
            
            // Log all instances before filtering
            console.log('[API GET /student/room-data] All instances:', chatbotInstances.map(inst => ({
              instance_id: inst.instance_id,
              chatbot_id: inst.chatbot_id,
              chatbot: inst.chatbots ? {
                name: (inst.chatbots as any).name,
                bot_type: (inst.chatbots as any).bot_type,
                is_archived: (inst.chatbots as any).is_archived
              } : null
            })));
            
            // Format the chatbots with instances, filtering out archived ones
            chatbots = chatbotInstances
              .filter(instance => {
                const chatbot = instance.chatbots as any;
                const isActive = chatbot && !chatbot.is_archived;
                if (!isActive && chatbot) {
                  console.log(`[API GET /student/room-data] Filtering out archived chatbot: ${chatbot.name} (${chatbot.bot_type})`);
                }
                return isActive;
              })
              .map(instance => {
                const chatbot = instance.chatbots as any; // Type assertion to avoid TypeScript errors
                return {
                  instance_id: instance.instance_id,
                  chatbot_id: instance.chatbot_id,
                  name: chatbot?.name || 'Unknown Bot',
                  description: chatbot?.description || '',
                  model: chatbot?.model,
                  bot_type: chatbot?.bot_type,
                  welcome_message: chatbot?.welcome_message
                };
              });
            
            console.log(`[API GET /student/room-data] After filtering: ${chatbots.length} active chatbots`);
            console.log('[API GET /student/room-data] Active chatbots by type:', 
              chatbots.reduce((acc, bot) => {
                acc[bot.bot_type || 'unknown'] = (acc[bot.bot_type || 'unknown'] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            );
          } else {
            // Need to create instances
            console.log(`[API GET /student/room-data] No instances found, getting chatbot details and creating instances`);
            
            // Get the chatbot details first
            const { data: chatbotsData, error: chatbotsError } = await supabaseAdmin
              .from('chatbots')
              .select('*')
              .in('chatbot_id', chatbotIds);
      
            if (chatbotsError) {
              console.error('[API GET /student/room-data] Error fetching chatbot details:', chatbotsError);
              throw new Error(`Error fetching chatbot details: ${chatbotsError.message}`);
            }
            
            if (chatbotsData && chatbotsData.length > 0) {
              console.log(`[API GET /student/room-data] Found ${chatbotsData.length} chatbots for room`);
              console.log('[API GET /student/room-data] Chatbots details:', chatbotsData.map(bot => ({
                chatbot_id: bot.chatbot_id,
                name: bot.name,
                bot_type: bot.bot_type,
                is_archived: bot.is_archived
              })));
              
              // Filter out archived chatbots before creating instances
              const activeChatbots = chatbotsData.filter(chatbot => !chatbot.is_archived);
              console.log(`[API GET /student/room-data] ${activeChatbots.length} active chatbots after filtering`);
              
              if (activeChatbots.length > 0) {
                // Create instances for each active chatbot
                const instancesData = activeChatbots.map(chatbot => ({
                student_id: actualStudentId,
                chatbot_id: chatbot.chatbot_id,
                room_id: roomId
              }));
              
              const { data: newInstances, error: createError } = await supabaseAdmin
                .from('student_chatbot_instances')
                .upsert(instancesData, { onConflict: 'student_id,chatbot_id,room_id' })
                .select(`
                  instance_id,
                  chatbot_id,
                  chatbots (
                    chatbot_id,
                    name,
                    description,
                    model,
                    bot_type,
                    welcome_message,
                    is_archived
                  )
                `);
                
              if (createError) {
                console.error('[API GET /student/room-data] Error creating chatbot instances:', createError);
                throw new Error(`Error creating chatbot instances: ${createError.message}`);
              } else if (newInstances) {
                console.log(`[API GET /student/room-data] Created ${newInstances.length} new instances for student ${userId}`);
                
                // Format the chatbots with instances, filtering out any archived ones
                chatbots = newInstances
                  .filter(instance => {
                    const chatbot = instance.chatbots as any;
                    return chatbot && !chatbot.is_archived;
                  })
                  .map(instance => {
                    const chatbot = instance.chatbots as any; // Type assertion to avoid TypeScript errors
                    return {
                      instance_id: instance.instance_id,
                      chatbot_id: instance.chatbot_id,
                      name: chatbot?.name || 'Unknown Bot',
                      description: chatbot?.description || '',
                      model: chatbot?.model,
                      bot_type: chatbot?.bot_type,
                      welcome_message: chatbot?.welcome_message
                    };
                  });
                }
              }
            }
          }
        }

        // Get courses for the room
        const { data: roomCourses, error: coursesRelationError } = await supabaseAdmin
          .from('room_courses')
          .select(`
            course_id,
            courses (
              course_id,
              title,
              description,
              subject,
              is_published,
              course_lessons (
                lesson_id,
                title,
                lesson_order
              )
            )
          `)
          .eq('room_id', roomId);

        if (coursesRelationError) {
          console.error('[API GET /student/room-data] Error fetching room courses:', coursesRelationError);
        }

        // Filter and format courses
        const courses = roomCourses?.map(rc => rc.courses).filter((course: any) => {
          if (!course) return false;
          // Only show published courses to students
          return course.is_published;
        }) || [];
        
        console.log('[API GET /student/room-data] Courses found:', {
          total: roomCourses?.length || 0,
          filtered: courses.length,
          courseDetails: courses.map((c: any) => ({ 
            id: c.course_id, 
            title: c.title, 
            published: c.is_published 
          }))
        });
        
        // Log final chatbot summary
        console.log('[API GET /student/room-data] Final chatbot summary:', {
          total: chatbots.length,
          byType: chatbots.reduce((acc, bot) => {
            const type = bot.bot_type || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          chatbots: chatbots.map(bot => ({
            name: bot.name,
            bot_type: bot.bot_type,
            instance_id: bot.instance_id
          }))
        });

        return { chatbots, courses };
      },
      {
        ttl: CacheTTL.VERY_SHORT, // 1 minute - student instances can change
        tags: [
          CacheTags.ROOM_CHATBOTS(roomId), 
          CacheTags.STUDENT(userId),
          CacheTags.ROOM(roomId)
        ]
      }
    );

    // Return room, chatbots, and courses data
    return createSuccessResponse({
      room: {
        ...room,
        room_chatbots: []
      },
      chatbots: roomData.chatbots,
      courses: roomData.courses
    });
  } catch (error) {
    console.error('[API GET /student/room-data] General error:', error);
    return handleApiError(error);
  }
}